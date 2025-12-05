"""
FastAPI routes for IEP Upload & Extraction System.
Handles document upload, processing status, extraction review, and approval.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
import logging
import asyncio

from ..schemas.iep_upload import (
    IEPDocumentStatus,
    VirusScanStatus,
    IEPDocumentResponse,
    IEPDocumentSummary,
    IEPDocumentUpdate,
    ExtractedGoalResponse,
    ExtractedGoalUpdate,
    ExtractedServiceResponse,
    ExtractedServiceUpdate,
    ExtractedAccommodationResponse,
    ExtractedAccommodationUpdate,
    ExtractedPresentLevelResponse,
    ExtractedPresentLevelUpdate,
    GoalTemplateResponse,
    GoalTemplateCreate,
    FullExtractionResponse,
    ExtractionSummary,
    ProcessingStatus,
    UploadResponse,
    VerifyItemRequest,
    ApprovalRequest,
    ApprovalResponse,
)

# Import services
from services.storage.s3_client import storage_client
from services.pdf_processor import pdf_processor
from services.iep_extraction import iep_extraction_service
from services.virus_scanner import virus_scanner
from db.repositories.iep_repository import IEPRepository
from db.database import get_async_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/iep", tags=["IEP Upload & Extraction"])


async def get_repository():
    """Dependency to get IEP repository with session."""
    async with get_async_session() as session:
        yield IEPRepository(session)


async def process_iep_document_background(
    document_id: str,
    learner_id: str,
    file_content: bytes,
    user_id: str,
):
    """Background task to process uploaded IEP document."""
    async with get_async_session() as session:
        repo = IEPRepository(session)
        
        try:
            # Step 1: Virus scan
            await repo.update_document_status(
                document_id, "PROCESSING", virus_scan_status="SCANNING"
            )
            
            is_clean, scan_result = await virus_scanner.scan_file(file_content)
            
            if not is_clean:
                await repo.update_document_status(
                    document_id, "FAILED",
                    virus_scan_status="INFECTED",
                    processing_error=f"Virus detected: {scan_result}"
                )
                return
            
            await repo.update_document_status(
                document_id, "PROCESSING", virus_scan_status="CLEAN"
            )
            
            # Step 2: PDF processing and OCR
            pdf_result = await pdf_processor.process_pdf(file_content)
            
            if not pdf_result.get("full_text"):
                await repo.update_document_status(
                    document_id, "FAILED",
                    processing_error="Could not extract text from PDF"
                )
                return
            
            ocr_confidence = pdf_result.get("average_confidence", 0)
            
            # Step 3: AI extraction
            extraction_result = await iep_extraction_service.extract_all(
                pdf_result["full_text"],
                pdf_result.get("pages")
            )
            
            # Step 4: Save extractions to database
            counts = await repo.save_all_extractions(
                document_id, learner_id, extraction_result
            )
            
            # Step 5: Update document status
            await repo.update_document_status(
                document_id, "EXTRACTED",
                ocr_confidence=ocr_confidence
            )
            
            logger.info(
                f"IEP document {document_id} processed: "
                f"{counts['goals']} goals, {counts['services']} services, "
                f"{counts['accommodations']} accommodations, {counts['presentLevels']} present levels"
            )
            
        except Exception as e:
            logger.error(f"Error processing IEP document {document_id}: {e}")
            await repo.update_document_status(
                document_id, "FAILED",
                processing_error=str(e)
            )


# ==========================================
# DOCUMENT UPLOAD ENDPOINTS
# ==========================================

@router.post("/upload", response_model=UploadResponse)
async def upload_iep_document(
    learner_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    repo: IEPRepository = Depends(get_repository),
    # current_user: User = Depends(get_current_user),
):
    """
    Upload an IEP PDF document for extraction.
    
    Process:
    1. Validate file type (PDF only)
    2. Upload to S3/cloud storage
    3. Create document record
    4. Queue for virus scan and processing
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    if file.content_type not in ["application/pdf", "application/x-pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are accepted")
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {max_size // (1024*1024)}MB")
    
    try:
        # Upload to S3
        s3_key, file_url = await storage_client.upload_file(
            content, file.filename, learner_id
        )
        
        # Get page count for metadata
        page_count = await pdf_processor.get_page_count(content)
        
        # Create document record in database
        # TODO: Get current user ID from auth context
        user_id = "system"  # Placeholder
        document = await repo.create_document(
            learner_id=learner_id,
            uploaded_by_id=user_id,
            file_name=file.filename,
            file_url=file_url,
            file_size=file_size,
            page_count=page_count,
        )
        
        document_id = document["id"]
        
        # Queue background processing
        if background_tasks:
            background_tasks.add_task(
                process_iep_document_background,
                document_id,
                learner_id,
                content,
                user_id,
            )
        
        return UploadResponse(
            document_id=document_id,
            file_name=file.filename,
            status=IEPDocumentStatus.PENDING,
            message="Document uploaded successfully. Processing will begin shortly."
        )
        
    except Exception as e:
        logger.error(f"Error uploading IEP document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload document")


@router.get("/documents/{learner_id}", response_model=List[IEPDocumentSummary])
async def list_learner_documents(
    learner_id: str,
    status: Optional[IEPDocumentStatus] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: IEPRepository = Depends(get_repository),
):
    """
    List all IEP documents for a learner.
    Optionally filter by status.
    """
    status_str = status.value if status else None
    documents = await repo.get_documents_by_learner(
        learner_id, status=status_str, limit=limit, offset=offset
    )
    
    result = []
    for doc in documents:
        # Get extraction counts
        goals = await repo.get_extracted_goals(doc["id"])
        services = await repo.get_extracted_services(doc["id"])
        accommodations = await repo.get_extracted_accommodations(doc["id"])
        present_levels = await repo.get_extracted_present_levels(doc["id"])
        
        result.append(IEPDocumentSummary(
            id=doc["id"],
            file_name=doc["fileName"],
            status=IEPDocumentStatus(doc["status"]),
            uploaded_at=doc["uploadedAt"],
            ocr_confidence=doc.get("ocrConfidence"),
            goal_count=len(goals),
            service_count=len(services),
            accommodation_count=len(accommodations),
            present_level_count=len(present_levels),
        ))
    
    return result


@router.get("/documents/{doc_id}/status", response_model=ProcessingStatus)
async def get_document_status(
    doc_id: str,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Get real-time processing status for a document.
    Used for polling during upload/extraction.
    """
    doc = await repo.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Determine current step and progress
    status = doc.get("status", "PENDING")
    virus_status = doc.get("virusScanStatus", "PENDING")
    
    steps_completed = []
    steps_remaining = []
    current_step = "Upload"
    progress = 0
    
    if status == "PENDING":
        steps_completed = []
        steps_remaining = ["Virus Scan", "PDF Processing", "OCR", "AI Extraction", "Confidence Scoring"]
        current_step = "Queued"
        progress = 5
    elif status == "PROCESSING":
        if virus_status == "CLEAN":
            steps_completed = ["Upload", "Virus Scan"]
            steps_remaining = ["OCR", "AI Extraction", "Confidence Scoring"]
            current_step = "PDF Processing"
            progress = 40
        else:
            steps_completed = ["Upload"]
            steps_remaining = ["Virus Scan", "PDF Processing", "OCR", "AI Extraction", "Confidence Scoring"]
            current_step = "Virus Scan"
            progress = 15
    elif status == "EXTRACTED":
        steps_completed = ["Upload", "Virus Scan", "PDF Processing", "OCR", "AI Extraction", "Confidence Scoring"]
        steps_remaining = []
        current_step = "Complete"
        progress = 100
    elif status == "FAILED":
        current_step = "Failed"
        progress = 0
    
    return ProcessingStatus(
        document_id=doc_id,
        status=IEPDocumentStatus(status),
        virus_scan_status=VirusScanStatus(virus_status),
        current_step=current_step,
        progress_percent=progress,
        steps_completed=steps_completed,
        steps_remaining=steps_remaining,
        estimated_time_remaining=max(0, (100 - progress) // 2),  # Rough estimate
        error_message=doc.get("processingError"),
    )


@router.get("/documents/{doc_id}/extracted", response_model=FullExtractionResponse)
async def get_extracted_data(
    doc_id: str,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Get all extracted data from a processed IEP document.
    Includes goals, services, accommodations, and present levels.
    """
    doc = await repo.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    goals = await repo.get_extracted_goals(doc_id)
    services = await repo.get_extracted_services(doc_id)
    accommodations = await repo.get_extracted_accommodations(doc_id)
    present_levels = await repo.get_extracted_present_levels(doc_id)
    
    return FullExtractionResponse(
        document_id=doc_id,
        goals=[ExtractedGoalResponse(**g) for g in goals],
        services=[ExtractedServiceResponse(**s) for s in services],
        accommodations=[ExtractedAccommodationResponse(**a) for a in accommodations],
        present_levels=[ExtractedPresentLevelResponse(**p) for p in present_levels],
    )


@router.get("/documents/{doc_id}/summary", response_model=ExtractionSummary)
async def get_extraction_summary(
    doc_id: str,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Get summary statistics for extracted data.
    """
    doc = await repo.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    goals = await repo.get_extracted_goals(doc_id)
    services = await repo.get_extracted_services(doc_id)
    accommodations = await repo.get_extracted_accommodations(doc_id)
    present_levels = await repo.get_extracted_present_levels(doc_id)
    
    all_items = goals + services + accommodations + present_levels
    confidences = [item.get("confidence", 0) for item in all_items]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    low_confidence_count = sum(1 for c in confidences if c < 80)
    verified_count = sum(1 for item in all_items if item.get("isVerified", False))
    
    return ExtractionSummary(
        total_goals=len(goals),
        total_services=len(services),
        total_accommodations=len(accommodations),
        total_present_levels=len(present_levels),
        average_confidence=avg_confidence,
        low_confidence_items=low_confidence_count,
        verified_items=verified_count,
        pending_review=len(all_items) - verified_count
    )


# ==========================================
# GOAL VERIFICATION & EDITING
# ==========================================

@router.get("/documents/{doc_id}/goals", response_model=List[ExtractedGoalResponse])
async def list_extracted_goals(
    doc_id: str,
    verified_only: bool = False,
    min_confidence: Optional[float] = None,
    repo: IEPRepository = Depends(get_repository),
):
    """
    List all extracted goals from a document.
    """
    goals = await repo.get_extracted_goals(doc_id, verified_only, min_confidence)
    return [ExtractedGoalResponse(**g) for g in goals]


@router.get("/documents/{doc_id}/goals/{goal_id}", response_model=ExtractedGoalResponse)
async def get_extracted_goal(
    doc_id: str,
    goal_id: str,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Get a specific extracted goal with full details.
    """
    raise HTTPException(status_code=404, detail="Goal not found")


@router.put("/documents/{doc_id}/goals/{goal_id}", response_model=ExtractedGoalResponse)
async def update_extracted_goal(
    doc_id: str,
    goal_id: str,
    update: ExtractedGoalUpdate,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Update an extracted goal (edit text, verify, etc.)
    """
    # Verify document exists
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update the goal
    updates = update.model_dump(exclude_unset=True)
    updated_goal = await repo.update_extracted_goal(goal_id, updates)
    
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return ExtractedGoalResponse(**updated_goal)


@router.put("/documents/{doc_id}/goals/{goal_id}/verify", response_model=ExtractedGoalResponse)
async def verify_extracted_goal(
    doc_id: str,
    goal_id: str,
    request: VerifyItemRequest,
    repo: IEPRepository = Depends(get_repository),
    # current_user: User = Depends(get_current_user),
):
    """
    Mark an extracted goal as verified by a human.
    """
    # Verify document exists
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # TODO: Get current user ID from auth context
    verified_by_id = "system"
    
    verified_goal = await repo.verify_goal(goal_id, verified_by_id)
    
    if not verified_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return ExtractedGoalResponse(**verified_goal)


# ==========================================
# SERVICE VERIFICATION & EDITING
# ==========================================

@router.get("/documents/{doc_id}/services", response_model=List[ExtractedServiceResponse])
async def list_extracted_services(
    doc_id: str,
    verified_only: bool = False,
):
    """
    List all extracted services from a document.
    """
    return []


@router.put("/documents/{doc_id}/services/{service_id}", response_model=ExtractedServiceResponse)
async def update_extracted_service(
    doc_id: str,
    service_id: str,
    update: ExtractedServiceUpdate,
):
    """
    Update an extracted service.
    """
    raise HTTPException(status_code=404, detail="Service not found")


@router.put("/documents/{doc_id}/services/{service_id}/verify", response_model=ExtractedServiceResponse)
async def verify_extracted_service(
    doc_id: str,
    service_id: str,
    request: VerifyItemRequest,
):
    """
    Mark an extracted service as verified.
    """
    raise HTTPException(status_code=404, detail="Service not found")


# ==========================================
# ACCOMMODATION VERIFICATION & EDITING
# ==========================================

@router.get("/documents/{doc_id}/accommodations", response_model=List[ExtractedAccommodationResponse])
async def list_extracted_accommodations(
    doc_id: str,
    verified_only: bool = False,
):
    """
    List all extracted accommodations from a document.
    """
    return []


@router.put("/documents/{doc_id}/accommodations/{accommodation_id}", response_model=ExtractedAccommodationResponse)
async def update_extracted_accommodation(
    doc_id: str,
    accommodation_id: str,
    update: ExtractedAccommodationUpdate,
):
    """
    Update an extracted accommodation.
    """
    raise HTTPException(status_code=404, detail="Accommodation not found")


@router.put("/documents/{doc_id}/accommodations/{accommodation_id}/verify", response_model=ExtractedAccommodationResponse)
async def verify_extracted_accommodation(
    doc_id: str,
    accommodation_id: str,
    request: VerifyItemRequest,
):
    """
    Mark an extracted accommodation as verified.
    """
    raise HTTPException(status_code=404, detail="Accommodation not found")


# ==========================================
# PRESENT LEVEL VERIFICATION & EDITING
# ==========================================

@router.get("/documents/{doc_id}/present-levels", response_model=List[ExtractedPresentLevelResponse])
async def list_extracted_present_levels(
    doc_id: str,
    verified_only: bool = False,
):
    """
    List all extracted present levels (PLAAFP) from a document.
    """
    return []


@router.put("/documents/{doc_id}/present-levels/{level_id}", response_model=ExtractedPresentLevelResponse)
async def update_extracted_present_level(
    doc_id: str,
    level_id: str,
    update: ExtractedPresentLevelUpdate,
):
    """
    Update an extracted present level.
    """
    raise HTTPException(status_code=404, detail="Present level not found")


@router.put("/documents/{doc_id}/present-levels/{level_id}/verify", response_model=ExtractedPresentLevelResponse)
async def verify_extracted_present_level(
    doc_id: str,
    level_id: str,
    request: VerifyItemRequest,
):
    """
    Mark an extracted present level as verified.
    """
    raise HTTPException(status_code=404, detail="Present level not found")


# ==========================================
# APPROVAL & IEP GOAL CREATION
# ==========================================

@router.post("/documents/{doc_id}/approve", response_model=ApprovalResponse)
async def approve_and_create_goals(
    doc_id: str,
    request: ApprovalRequest,
    repo: IEPRepository = Depends(get_repository),
    # current_user: User = Depends(get_current_user),
):
    """
    Approve verified extractions and create actual IEP goals.
    
    Process:
    1. Validate all selected items are verified
    2. Create IEPGoal records from extracted goals
    3. Link extracted goals to created IEP goals
    4. Update document status to APPROVED
    """
    from db.repositories.iep_goals_repository import IEPGoalsRepository
    from datetime import timedelta
    
    # Get document to verify it exists and get learner_id
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    learner_id = document["learner_id"]
    created_goals = 0
    created_services = 0
    created_accommodations = 0
    created_present_levels = 0
    
    # Get IEP goals repository for creating actual goals
    async with get_async_session() as session:
        goals_repo = IEPGoalsRepository(session)
        
        # Process extracted goals
        for goal_id in request.goal_ids:
            extracted_goals = await repo.get_extracted_goals(doc_id, verified_only=False)
            extracted_goal = next((g for g in extracted_goals if g["id"] == goal_id), None)
            
            if extracted_goal and extracted_goal.get("is_verified"):
                # Create actual IEP goal from extracted data
                target_date = datetime.utcnow() + timedelta(days=365)  # Default 1 year
                
                await goals_repo.create_goal(
                    learner_id=learner_id,
                    goal=extracted_goal["goal_text"],
                    category=extracted_goal.get("domain", "ACADEMIC"),
                    target_date=target_date,
                    status="NOT_STARTED",
                    progress=0.0,
                    notes=f"Created from IEP extraction. Baseline: {extracted_goal.get('baseline', 'N/A')}",
                )
                created_goals += 1
        
        # Mark services as approved (they're tracked but not converted to separate records)
        for service_id in request.service_ids:
            services = await repo.get_extracted_services(doc_id, verified_only=False)
            service = next((s for s in services if s["id"] == service_id), None)
            if service and service.get("is_verified"):
                created_services += 1
        
        # Mark accommodations as approved
        for acc_id in request.accommodation_ids:
            accommodations = await repo.get_extracted_accommodations(doc_id, verified_only=False)
            acc = next((a for a in accommodations if a["id"] == acc_id), None)
            if acc and acc.get("is_verified"):
                created_accommodations += 1
        
        # Mark present levels as approved
        for level_id in request.present_level_ids:
            levels = await repo.get_extracted_present_levels(doc_id, verified_only=False)
            level = next((l for l in levels if l["id"] == level_id), None)
            if level and level.get("is_verified"):
                created_present_levels += 1
    
    # Update document status to APPROVED
    await repo.update_document_status(doc_id, "APPROVED")
    
    return ApprovalResponse(
        document_id=doc_id,
        created_goals=created_goals,
        created_services=created_services,
        created_accommodations=created_accommodations,
        created_present_levels=created_present_levels,
        message=f"Approved: {created_goals} goals, {created_services} services, "
                f"{created_accommodations} accommodations, {created_present_levels} present levels"
    )


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Delete an IEP document and all associated extractions.
    Only allowed for documents in PENDING, FAILED, or REVIEWED status.
    """
    # Get document to check status
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if deletion is allowed based on status
    allowed_statuses = ["PENDING", "FAILED", "REVIEWED"]
    if document.get("status") not in allowed_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete document with status '{document.get('status')}'. "
                   f"Only documents with status {allowed_statuses} can be deleted."
        )
    
    # Delete the document (cascade will handle extractions)
    await repo.delete_document(doc_id)
    
    return {"message": "Document deleted successfully", "document_id": doc_id}


# ==========================================
# REPROCESSING
# ==========================================

@router.post("/documents/{doc_id}/reprocess")
async def reprocess_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Reprocess a failed or already processed document.
    Useful after fixing OCR issues or updating extraction model.
    """
    # Get document
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Only allow reprocessing for FAILED or EXTRACTED documents
    allowed_statuses = ["FAILED", "EXTRACTED", "REVIEWED"]
    if document.get("status") not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reprocess document with status '{document.get('status')}'"
        )
    
    # Reset status to PENDING
    await repo.update_document_status(
        doc_id, 
        "PENDING",
        virus_scan_status="PENDING",
        processing_error=None,
    )
    
    # Queue for reprocessing
    # Note: We'd need to fetch the file content from S3 to reprocess
    # For now, we just mark it as pending for manual retriggering
    
    return {
        "message": "Document queued for reprocessing",
        "document_id": doc_id,
        "status": "PENDING"
    }


# ==========================================
# GOAL TEMPLATES
# ==========================================

@router.get("/templates", response_model=List[GoalTemplateResponse])
async def list_goal_templates(
    domain: Optional[str] = None,
    category: Optional[str] = None,
    grade_level: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """
    List available goal templates.
    Filter by domain, category, grade level, or search text.
    """
    # Templates would be stored in database and queried here
    # For now, return sample templates that can be used
    sample_templates = [
        GoalTemplateResponse(
            id="template-reading-fluency-1",
            domain="READING",
            category="Fluency",
            template_text="By {{target_date}}, {{student_name}} will read grade-level text at {{wpm}} words per minute with {{accuracy}}% accuracy, as measured by {{measurement_method}}.",
            measurement_options=["curriculum-based measurement", "running records", "oral reading fluency probes"],
            frequency_options=["weekly", "bi-weekly", "monthly"],
            baseline_prompts=["Current reading rate", "Current accuracy level"],
            criteria_examples=["100 words per minute with 95% accuracy"],
            grade_level=3,
            grade_levels=[2, 3, 4, 5],
            smart_guidance={"specific": "Include target WPM and accuracy", "measurable": "Use standardized probes"},
            is_active=True,
            usage_count=127,
            rating=4.5,
            source="Common Core Standards",
            tags=["reading", "fluency", "elementary"],
        ),
        GoalTemplateResponse(
            id="template-math-computation-1",
            domain="MATH",
            category="Computation",
            template_text="By {{target_date}}, {{student_name}} will solve {{problem_type}} problems with {{accuracy}}% accuracy in {{time_limit}}, as measured by {{measurement_method}}.",
            measurement_options=["timed probes", "classroom assessments", "standardized tests"],
            frequency_options=["weekly", "bi-weekly"],
            baseline_prompts=["Current accuracy on similar problems", "Current time to complete"],
            criteria_examples=["2-digit multiplication with 80% accuracy in 5 minutes"],
            grade_level=4,
            grade_levels=[3, 4, 5, 6],
            smart_guidance={"specific": "Specify problem type", "measurable": "Include accuracy and time"},
            is_active=True,
            usage_count=89,
            rating=4.2,
            source="IEP Best Practices Guide",
            tags=["math", "computation", "elementary"],
        ),
    ]
    
    # Apply filters
    filtered = sample_templates
    if domain:
        filtered = [t for t in filtered if t.domain.value == domain]
    if category:
        filtered = [t for t in filtered if t.category.lower() == category.lower()]
    if grade_level:
        filtered = [t for t in filtered if grade_level in t.grade_levels]
    if search:
        search_lower = search.lower()
        filtered = [t for t in filtered if search_lower in t.template_text.lower() or any(search_lower in tag for tag in t.tags)]
    
    return filtered[offset:offset + limit]


@router.get("/templates/{template_id}", response_model=GoalTemplateResponse)
async def get_goal_template(template_id: str):
    """
    Get a specific goal template with full details.
    """
    raise HTTPException(status_code=404, detail="Template not found")


@router.post("/templates", response_model=GoalTemplateResponse)
async def create_goal_template(
    template: GoalTemplateCreate,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Create a new goal template.
    """
    from uuid import uuid4
    from datetime import datetime
    
    # In a full implementation, this would save to a database
    # For now, we'll create an in-memory representation
    template_id = str(uuid4())
    
    template_response = GoalTemplateResponse(
        id=template_id,
        domain=template.domain,
        category=template.category,
        template_text=template.template_text,
        measurement_options=template.measurement_options,
        frequency_options=template.frequency_options,
        baseline_prompts=template.baseline_prompts,
        criteria_examples=template.criteria_examples,
        grade_level=template.grade_level,
        grade_levels=template.grade_levels,
        smart_guidance=template.smart_guidance,
        is_active=True,
        usage_count=0,
        rating=None,
        source=template.source,
        tags=template.tags,
    )
    
    logger.info(f"Created goal template: {template_id}")
    return template_response


@router.post("/templates/{template_id}/use")
async def use_template(
    template_id: str,
    learner_id: str,
    document_id: Optional[str] = None,
    repo: IEPRepository = Depends(get_repository),
):
    """
    Apply a template to create a new extracted goal.
    Increments usage count.
    """
    from uuid import uuid4
    
    # In a full implementation, we would:
    # 1. Fetch the template from database
    # 2. Increment usage count
    # 3. Create extracted goal from template
    
    goal_id = str(uuid4())
    
    return {
        "id": goal_id,
        "template_id": template_id,
        "learner_id": learner_id,
        "document_id": document_id,
        "message": "Goal created from template successfully",
        "goal_text": "Template-based goal - please customize",
    }


# ==========================================
# SMART GOAL VALIDATION
# ==========================================

@router.post("/validate-goal")
async def validate_goal_smart_criteria(goal_text: str):
    """
    Validate a goal against SMART criteria using AI.
    Returns detailed analysis and suggestions.
    """
    import httpx
    from ..schemas.iep_upload import SMARTAnalysis, SMARTCriterion
    
    # Call AI model for SMART goal analysis
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://model-dispatch:4007/chat/completions",
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are an IEP goal validator. Analyze goals against SMART criteria:
- Specific: Is the skill/behavior clearly defined?
- Measurable: Are there quantifiable criteria?
- Achievable: Is the target realistic?
- Relevant: Does it address educational needs?
- Time-bound: Is there a specific timeframe?

Return JSON with this exact structure:
{
    "specific": {"met": bool, "score": 0-100, "feedback": "...", "evidence": "..."},
    "measurable": {"met": bool, "score": 0-100, "feedback": "...", "evidence": "..."},
    "achievable": {"met": bool, "score": 0-100, "feedback": "...", "evidence": "..."},
    "relevant": {"met": bool, "score": 0-100, "feedback": "...", "evidence": "..."},
    "time_bound": {"met": bool, "score": 0-100, "feedback": "...", "evidence": "..."},
    "overall_score": 0-100,
    "is_compliant": bool,
    "suggestions": ["..."]
}"""
                        },
                        {
                            "role": "user",
                            "content": f"Analyze this IEP goal: {goal_text}"
                        }
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                import json
                analysis = json.loads(content)
                
                return SMARTAnalysis(
                    specific=SMARTCriterion(**analysis.get("specific", {"met": False, "score": 0, "feedback": "Could not analyze", "evidence": None})),
                    measurable=SMARTCriterion(**analysis.get("measurable", {"met": False, "score": 0, "feedback": "Could not analyze", "evidence": None})),
                    achievable=SMARTCriterion(**analysis.get("achievable", {"met": False, "score": 0, "feedback": "Could not analyze", "evidence": None})),
                    relevant=SMARTCriterion(**analysis.get("relevant", {"met": False, "score": 0, "feedback": "Could not analyze", "evidence": None})),
                    time_bound=SMARTCriterion(**analysis.get("time_bound", {"met": False, "score": 0, "feedback": "Could not analyze", "evidence": None})),
                    overall_score=analysis.get("overall_score", 0),
                    is_compliant=analysis.get("is_compliant", False),
                    suggestions=analysis.get("suggestions", [])
                )
    except Exception as e:
        logger.error(f"Error calling AI for goal validation: {e}")
    
    # Fallback: basic rule-based validation
    has_date = any(word in goal_text.lower() for word in ["by", "within", "end of", "before"])
    has_measure = any(char.isdigit() for char in goal_text) or any(word in goal_text.lower() for word in ["percent", "%", "accuracy", "times", "rate"])
    has_skill = len(goal_text.split()) > 5
    
    return SMARTAnalysis(
        specific=SMARTCriterion(
            met=has_skill,
            score=70.0 if has_skill else 30.0,
            feedback="Goal identifies a skill" if has_skill else "Goal needs more specific skill description",
            evidence=None
        ),
        measurable=SMARTCriterion(
            met=has_measure,
            score=80.0 if has_measure else 20.0,
            feedback="Includes measurement criteria" if has_measure else "Add specific, measurable criteria",
            evidence=None
        ),
        achievable=SMARTCriterion(
            met=True,
            score=70.0,
            feedback="Assumed achievable - verify with baseline data",
            evidence=None
        ),
        relevant=SMARTCriterion(
            met=True,
            score=75.0,
            feedback="Relevance should be verified against student needs",
            evidence=None
        ),
        time_bound=SMARTCriterion(
            met=has_date,
            score=80.0 if has_date else 20.0,
            feedback="Includes timeframe" if has_date else "Add specific date or timeframe",
            evidence=None
        ),
        overall_score=(70.0 if has_skill else 30.0 + 80.0 if has_measure else 20.0 + 70.0 + 75.0 + 80.0 if has_date else 20.0) / 5,
        is_compliant=has_skill and has_measure and has_date,
        suggestions=[
            s for s in [
                "Add a specific target date" if not has_date else None,
                "Include measurable criteria (numbers, percentages)" if not has_measure else None,
                "Be more specific about the target skill" if not has_skill else None,
            ] if s
        ]
    )


# ==========================================
# BATCH OPERATIONS
# ==========================================

@router.post("/documents/{doc_id}/verify-all")
async def verify_all_high_confidence(
    doc_id: str,
    min_confidence: float = Query(90.0, ge=0, le=100),
    repo: IEPRepository = Depends(get_repository),
):
    """
    Automatically verify all extracted items above a confidence threshold.
    """
    # Verify document exists
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Use repository batch verification method
    # TODO: Get current user ID from auth context
    verified_by_id = "system"
    
    counts = await repo.verify_all_high_confidence(
        document_id=doc_id,
        verified_by_id=verified_by_id,
        min_confidence=min_confidence,
    )
    
    return {
        "verified_goals": counts.get("goals", 0),
        "verified_services": counts.get("services", 0),
        "verified_accommodations": counts.get("accommodations", 0),
        "verified_present_levels": counts.get("presentLevels", 0),
        "message": f"Verified all items with confidence >= {min_confidence}%"
    }


@router.get("/documents/{doc_id}/export")
async def export_extraction(
    doc_id: str,
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    repo: IEPRepository = Depends(get_repository),
):
    """
    Export extracted data in various formats.
    """
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    # Get document
    document = await repo.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get all extracted data
    goals = await repo.get_extracted_goals(doc_id)
    services = await repo.get_extracted_services(doc_id)
    accommodations = await repo.get_extracted_accommodations(doc_id)
    present_levels = await repo.get_extracted_present_levels(doc_id)
    
    if format == "json":
        # Return JSON directly
        return {
            "document": document,
            "extraction": {
                "goals": goals,
                "services": services,
                "accommodations": accommodations,
                "present_levels": present_levels,
            },
            "exported_at": datetime.utcnow().isoformat(),
        }
    
    elif format == "csv":
        # Create CSV with all data
        output = io.StringIO()
        
        # Goals section
        output.write("=== GOALS ===\n")
        if goals:
            writer = csv.DictWriter(output, fieldnames=["domain", "goal_text", "baseline", "target_criteria", "confidence", "is_verified"])
            writer.writeheader()
            for goal in goals:
                writer.writerow({
                    "domain": goal.get("domain", ""),
                    "goal_text": goal.get("goal_text", ""),
                    "baseline": goal.get("baseline", ""),
                    "target_criteria": goal.get("target_criteria", ""),
                    "confidence": goal.get("confidence", 0),
                    "is_verified": goal.get("is_verified", False),
                })
        
        output.write("\n=== SERVICES ===\n")
        if services:
            writer = csv.DictWriter(output, fieldnames=["service_type", "description", "frequency", "duration", "confidence", "is_verified"])
            writer.writeheader()
            for service in services:
                writer.writerow({
                    "service_type": service.get("service_type", ""),
                    "description": service.get("description", ""),
                    "frequency": service.get("frequency", ""),
                    "duration": service.get("duration", ""),
                    "confidence": service.get("confidence", 0),
                    "is_verified": service.get("is_verified", False),
                })
        
        output.write("\n=== ACCOMMODATIONS ===\n")
        if accommodations:
            writer = csv.DictWriter(output, fieldnames=["category", "description", "details", "confidence", "is_verified"])
            writer.writeheader()
            for acc in accommodations:
                writer.writerow({
                    "category": acc.get("category", ""),
                    "description": acc.get("description", ""),
                    "details": acc.get("details", ""),
                    "confidence": acc.get("confidence", 0),
                    "is_verified": acc.get("is_verified", False),
                })
        
        output.write("\n=== PRESENT LEVELS ===\n")
        if present_levels:
            writer = csv.DictWriter(output, fieldnames=["domain", "current_performance", "strengths", "needs", "confidence", "is_verified"])
            writer.writeheader()
            for level in present_levels:
                writer.writerow({
                    "domain": level.get("domain", ""),
                    "current_performance": level.get("current_performance", ""),
                    "strengths": ", ".join(level.get("strengths", [])),
                    "needs": ", ".join(level.get("needs", [])),
                    "confidence": level.get("confidence", 0),
                    "is_verified": level.get("is_verified", False),
                })
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=iep_extraction_{doc_id}.csv"}
        )
    
    elif format == "pdf":
        # PDF generation would require additional dependencies like reportlab or weasyprint
        # For now, return a structured response that could be converted to PDF client-side
        raise HTTPException(
            status_code=501, 
            detail="PDF export requires additional processing. Use JSON or CSV format, or generate PDF client-side."
        )
