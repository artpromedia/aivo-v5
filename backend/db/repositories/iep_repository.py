"""
IEP Repository
Database operations for IEP documents, goals, and extractions.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import select, update, delete, and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


class IEPRepository:
    """
    Repository for IEP-related database operations.
    Works with SQLAlchemy async sessions.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # ==========================================
    # DOCUMENT OPERATIONS
    # ==========================================
    
    async def create_document(
        self,
        learner_id: str,
        uploaded_by_id: str,
        file_name: str,
        file_url: str,
        file_size: int,
        mime_type: str = "application/pdf",
        page_count: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create a new IEP document record."""
        from db.models import IEPDocument
        
        doc = IEPDocument(
            learner_id=learner_id,
            uploaded_by_id=uploaded_by_id,
            file_name=file_name,
            file_url=file_url,
            file_size=file_size,
            mime_type=mime_type,
            page_count=page_count,
            status="PENDING",
            virus_scan_status="PENDING",
        )
        
        self.session.add(doc)
        await self.session.commit()
        await self.session.refresh(doc)
        
        return doc.to_dict()
    
    async def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID."""
        from db.models import IEPDocument
        
        result = await self.session.execute(
            select(IEPDocument).where(IEPDocument.id == document_id)
        )
        doc = result.scalar_one_or_none()
        return doc.to_dict() if doc else None
    
    async def get_documents_by_learner(
        self,
        learner_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get all documents for a learner."""
        from db.models import IEPDocument
        
        query = select(IEPDocument).where(IEPDocument.learner_id == learner_id)
        
        if status:
            query = query.where(IEPDocument.status == status)
        
        query = query.order_by(IEPDocument.uploaded_at.desc())
        query = query.limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        docs = result.scalars().all()
        return [doc.to_dict() for doc in docs]
    
    async def update_document_status(
        self,
        document_id: str,
        status: str,
        virus_scan_status: Optional[str] = None,
        ocr_confidence: Optional[float] = None,
        processing_error: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update document processing status."""
        from db.models import IEPDocument
        
        updates = {"status": status, "updated_at": datetime.utcnow()}
        
        if virus_scan_status:
            updates["virus_scan_status"] = virus_scan_status
        if ocr_confidence is not None:
            updates["ocr_confidence"] = ocr_confidence
        if processing_error is not None:
            updates["processing_error"] = processing_error
        
        await self.session.execute(
            update(IEPDocument)
            .where(IEPDocument.id == document_id)
            .values(**updates)
        )
        await self.session.commit()
        
        return await self.get_document(document_id)
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and all related extractions."""
        from db.models import IEPDocument
        
        await self.session.execute(
            delete(IEPDocument).where(IEPDocument.id == document_id)
        )
        await self.session.commit()
        return True
    
    # ==========================================
    # EXTRACTED GOAL OPERATIONS
    # ==========================================
    
    async def create_extracted_goal(
        self,
        document_id: str,
        learner_id: str,
        domain: str,
        goal_text: str,
        confidence: float,
        goal_number: Optional[str] = None,
        baseline: Optional[str] = None,
        target_criteria: Optional[str] = None,
        measurement_method: Optional[str] = None,
        frequency: Optional[str] = None,
        page_number: Optional[int] = None,
        bounding_box: Optional[Dict] = None,
        smart_analysis: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Create an extracted goal record."""
        from db.models import IEPExtractedGoal
        
        goal = IEPExtractedGoal(
            document_id=document_id,
            learner_id=learner_id,
            domain=domain,
            goal_number=goal_number,
            goal_text=goal_text,
            baseline=baseline,
            target_criteria=target_criteria,
            measurement_method=measurement_method,
            frequency=frequency,
            confidence=confidence,
            page_number=page_number,
            bounding_box=bounding_box,
            smart_analysis=smart_analysis,
        )
        
        self.session.add(goal)
        await self.session.commit()
        await self.session.refresh(goal)
        
        return goal.to_dict()
    
    async def get_extracted_goals(
        self,
        document_id: str,
        verified_only: bool = False,
        min_confidence: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Get extracted goals for a document."""
        from db.models import IEPExtractedGoal
        
        query = select(IEPExtractedGoal).where(
            IEPExtractedGoal.document_id == document_id
        )
        
        if verified_only:
            query = query.where(IEPExtractedGoal.is_verified == True)
        if min_confidence is not None:
            query = query.where(IEPExtractedGoal.confidence >= min_confidence)
        
        query = query.order_by(IEPExtractedGoal.created_at)
        
        result = await self.session.execute(query)
        goals = result.scalars().all()
        return [goal.to_dict() for goal in goals]
    
    async def update_extracted_goal(
        self,
        goal_id: str,
        updates: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Update an extracted goal."""
        from db.models import IEPExtractedGoal
        
        updates["updated_at"] = datetime.utcnow()
        
        await self.session.execute(
            update(IEPExtractedGoal)
            .where(IEPExtractedGoal.id == goal_id)
            .values(**updates)
        )
        await self.session.commit()
        
        result = await self.session.execute(
            select(IEPExtractedGoal).where(IEPExtractedGoal.id == goal_id)
        )
        goal = result.scalar_one_or_none()
        return goal.to_dict() if goal else None
    
    async def verify_goal(
        self,
        goal_id: str,
        verified_by_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Mark an extracted goal as verified."""
        return await self.update_extracted_goal(goal_id, {
            "is_verified": True,
            "verified_by_id": verified_by_id,
            "verified_at": datetime.utcnow(),
        })
    
    # ==========================================
    # EXTRACTED SERVICE OPERATIONS
    # ==========================================
    
    async def create_extracted_service(
        self,
        document_id: str,
        learner_id: str,
        service_type: str,
        description: str,
        confidence: float,
        frequency: Optional[str] = None,
        duration: Optional[str] = None,
        location: Optional[str] = None,
        provider: Optional[str] = None,
        page_number: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create an extracted service record."""
        from db.models import IEPExtractedService
        
        service = IEPExtractedService(
            document_id=document_id,
            learner_id=learner_id,
            service_type=service_type,
            description=description,
            frequency=frequency,
            duration=duration,
            location=location,
            provider=provider,
            confidence=confidence,
            page_number=page_number,
        )
        
        self.session.add(service)
        await self.session.commit()
        await self.session.refresh(service)
        
        return service.to_dict()
    
    async def get_extracted_services(
        self,
        document_id: str,
        verified_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """Get extracted services for a document."""
        from db.models import IEPExtractedService
        
        query = select(IEPExtractedService).where(
            IEPExtractedService.document_id == document_id
        )
        
        if verified_only:
            query = query.where(IEPExtractedService.is_verified == True)
        
        result = await self.session.execute(query)
        services = result.scalars().all()
        return [s.to_dict() for s in services]
    
    # ==========================================
    # EXTRACTED ACCOMMODATION OPERATIONS
    # ==========================================
    
    async def create_extracted_accommodation(
        self,
        document_id: str,
        learner_id: str,
        category: str,
        description: str,
        confidence: float,
        details: Optional[str] = None,
        applies_to: Optional[List[str]] = None,
        page_number: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create an extracted accommodation record."""
        from db.models import IEPExtractedAccommodation
        
        accommodation = IEPExtractedAccommodation(
            document_id=document_id,
            learner_id=learner_id,
            category=category,
            description=description,
            details=details,
            applies_to=applies_to or ["ALL"],
            confidence=confidence,
            page_number=page_number,
        )
        
        self.session.add(accommodation)
        await self.session.commit()
        await self.session.refresh(accommodation)
        
        return accommodation.to_dict()
    
    async def get_extracted_accommodations(
        self,
        document_id: str,
        verified_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """Get extracted accommodations for a document."""
        from db.models import IEPExtractedAccommodation
        
        query = select(IEPExtractedAccommodation).where(
            IEPExtractedAccommodation.document_id == document_id
        )
        
        if verified_only:
            query = query.where(IEPExtractedAccommodation.is_verified == True)
        
        result = await self.session.execute(query)
        accommodations = result.scalars().all()
        return [a.to_dict() for a in accommodations]
    
    # ==========================================
    # EXTRACTED PRESENT LEVEL OPERATIONS
    # ==========================================
    
    async def create_extracted_present_level(
        self,
        document_id: str,
        learner_id: str,
        domain: str,
        current_performance: str,
        confidence: float,
        strengths: Optional[List[str]] = None,
        needs: Optional[List[str]] = None,
        parent_input: Optional[str] = None,
        how_disability_affects: Optional[str] = None,
        educational_implications: Optional[str] = None,
        page_number: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create an extracted present level record."""
        from db.models import IEPExtractedPresentLevel
        
        level = IEPExtractedPresentLevel(
            document_id=document_id,
            learner_id=learner_id,
            domain=domain,
            current_performance=current_performance,
            strengths=strengths or [],
            needs=needs or [],
            parent_input=parent_input,
            how_disability_affects=how_disability_affects,
            educational_implications=educational_implications,
            confidence=confidence,
            page_number=page_number,
        )
        
        self.session.add(level)
        await self.session.commit()
        await self.session.refresh(level)
        
        return level.to_dict()
    
    async def get_extracted_present_levels(
        self,
        document_id: str,
        verified_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """Get extracted present levels for a document."""
        from db.models import IEPExtractedPresentLevel
        
        query = select(IEPExtractedPresentLevel).where(
            IEPExtractedPresentLevel.document_id == document_id
        )
        
        if verified_only:
            query = query.where(IEPExtractedPresentLevel.is_verified == True)
        
        result = await self.session.execute(query)
        levels = result.scalars().all()
        return [l.to_dict() for l in levels]
    
    # ==========================================
    # BULK OPERATIONS
    # ==========================================
    
    async def save_all_extractions(
        self,
        document_id: str,
        learner_id: str,
        extraction_result: Dict[str, Any],
    ) -> Dict[str, int]:
        """Save all extracted data from an IEP document."""
        counts = {"goals": 0, "services": 0, "accommodations": 0, "presentLevels": 0}
        
        # Save goals
        for goal in extraction_result.get("goals", []):
            await self.create_extracted_goal(
                document_id=document_id,
                learner_id=learner_id,
                domain=goal.get("domain", "OTHER"),
                goal_text=goal.get("goalText", ""),
                confidence=goal.get("confidence", 0),
                goal_number=goal.get("goalNumber"),
                baseline=goal.get("baseline"),
                target_criteria=goal.get("targetCriteria"),
                measurement_method=goal.get("measurementMethod"),
                frequency=goal.get("frequency"),
            )
            counts["goals"] += 1
        
        # Save services
        for service in extraction_result.get("services", []):
            await self.create_extracted_service(
                document_id=document_id,
                learner_id=learner_id,
                service_type=service.get("serviceType", "OTHER"),
                description=service.get("description", ""),
                confidence=service.get("confidence", 0),
                frequency=service.get("frequency"),
                duration=service.get("duration"),
                location=service.get("location"),
                provider=service.get("provider"),
            )
            counts["services"] += 1
        
        # Save accommodations
        for acc in extraction_result.get("accommodations", []):
            await self.create_extracted_accommodation(
                document_id=document_id,
                learner_id=learner_id,
                category=acc.get("category", "OTHER"),
                description=acc.get("description", ""),
                confidence=acc.get("confidence", 0),
                details=acc.get("details"),
                applies_to=acc.get("appliesTo"),
            )
            counts["accommodations"] += 1
        
        # Save present levels
        for level in extraction_result.get("presentLevels", []):
            await self.create_extracted_present_level(
                document_id=document_id,
                learner_id=learner_id,
                domain=level.get("domain", "OTHER"),
                current_performance=level.get("currentPerformance", ""),
                confidence=level.get("confidence", 0),
                strengths=level.get("strengths"),
                needs=level.get("needs"),
                parent_input=level.get("parentInput"),
                how_disability_affects=level.get("howDisabilityAffects"),
                educational_implications=level.get("educationalImplications"),
            )
            counts["presentLevels"] += 1
        
        return counts
    
    async def verify_all_high_confidence(
        self,
        document_id: str,
        verified_by_id: str,
        min_confidence: float = 90.0,
    ) -> Dict[str, int]:
        """Auto-verify all items above confidence threshold."""
        from db.models import (
            IEPExtractedGoal,
            IEPExtractedService,
            IEPExtractedAccommodation,
            IEPExtractedPresentLevel,
        )
        
        now = datetime.utcnow()
        counts = {"goals": 0, "services": 0, "accommodations": 0, "presentLevels": 0}
        
        # Verify goals
        result = await self.session.execute(
            update(IEPExtractedGoal)
            .where(and_(
                IEPExtractedGoal.document_id == document_id,
                IEPExtractedGoal.confidence >= min_confidence,
                IEPExtractedGoal.is_verified == False,
            ))
            .values(is_verified=True, verified_by_id=verified_by_id, verified_at=now)
        )
        counts["goals"] = result.rowcount
        
        # Verify services
        result = await self.session.execute(
            update(IEPExtractedService)
            .where(and_(
                IEPExtractedService.document_id == document_id,
                IEPExtractedService.confidence >= min_confidence,
                IEPExtractedService.is_verified == False,
            ))
            .values(is_verified=True, verified_by_id=verified_by_id, verified_at=now)
        )
        counts["services"] = result.rowcount
        
        # Verify accommodations
        result = await self.session.execute(
            update(IEPExtractedAccommodation)
            .where(and_(
                IEPExtractedAccommodation.document_id == document_id,
                IEPExtractedAccommodation.confidence >= min_confidence,
                IEPExtractedAccommodation.is_verified == False,
            ))
            .values(is_verified=True, verified_by_id=verified_by_id, verified_at=now)
        )
        counts["accommodations"] = result.rowcount
        
        # Verify present levels
        result = await self.session.execute(
            update(IEPExtractedPresentLevel)
            .where(and_(
                IEPExtractedPresentLevel.document_id == document_id,
                IEPExtractedPresentLevel.confidence >= min_confidence,
                IEPExtractedPresentLevel.is_verified == False,
            ))
            .values(is_verified=True, verified_by_id=verified_by_id, verified_at=now)
        )
        counts["presentLevels"] = result.rowcount
        
        await self.session.commit()
        return counts
