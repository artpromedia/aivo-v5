"""
PDF Processing Service for IEP Documents
Handles PDF to image conversion, OCR, and text extraction.
"""

import os
import io
import tempfile
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Optional dependencies - graceful fallback if not installed
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    logger.warning("PyMuPDF not installed - PDF processing limited")

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    logger.warning("Pillow not installed - image processing limited")

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False
    logger.warning("pytesseract not installed - OCR disabled")


class PDFProcessor:
    """
    Process PDF documents for IEP extraction.
    Converts PDFs to images and performs OCR.
    """
    
    def __init__(self):
        self.dpi = int(os.getenv("PDF_DPI", "300"))
        self.tesseract_lang = os.getenv("TESSERACT_LANG", "eng")
    
    async def get_page_count(self, pdf_content: bytes) -> int:
        """Get the number of pages in a PDF."""
        if not HAS_PYMUPDF:
            logger.warning("PyMuPDF not available, returning estimate")
            return 1
        
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            page_count = len(doc)
            doc.close()
            return page_count
        except Exception as e:
            logger.error(f"Error getting page count: {e}")
            return 0
    
    async def pdf_to_images(
        self,
        pdf_content: bytes,
        max_pages: Optional[int] = None
    ) -> List[bytes]:
        """
        Convert PDF pages to images.
        
        Returns:
            List of PNG image bytes for each page
        """
        if not HAS_PYMUPDF:
            logger.error("PyMuPDF required for PDF to image conversion")
            return []
        
        images = []
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            page_limit = min(len(doc), max_pages) if max_pages else len(doc)
            
            for page_num in range(page_limit):
                page = doc.load_page(page_num)
                
                # Render page at specified DPI
                zoom = self.dpi / 72.0
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PNG bytes
                img_bytes = pix.tobytes("png")
                images.append(img_bytes)
                
                logger.debug(f"Converted page {page_num + 1}")
            
            doc.close()
            return images
            
        except Exception as e:
            logger.error(f"Error converting PDF to images: {e}")
            return []
    
    async def extract_text_native(self, pdf_content: bytes) -> List[Dict[str, Any]]:
        """
        Extract text natively from PDF (faster, works if PDF has text layer).
        
        Returns:
            List of dicts with page_number, text, and bounding boxes
        """
        if not HAS_PYMUPDF:
            return []
        
        pages_text = []
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            
            for page_num, page in enumerate(doc):
                text = page.get_text("text")
                blocks = page.get_text("dict")["blocks"]
                
                # Extract text with positions
                text_blocks = []
                for block in blocks:
                    if block.get("type") == 0:  # Text block
                        bbox = block.get("bbox", [])
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                text_blocks.append({
                                    "text": span.get("text", ""),
                                    "bbox": {
                                        "x": bbox[0] if bbox else 0,
                                        "y": bbox[1] if bbox else 0,
                                        "width": (bbox[2] - bbox[0]) if len(bbox) >= 4 else 0,
                                        "height": (bbox[3] - bbox[1]) if len(bbox) >= 4 else 0,
                                    },
                                    "font": span.get("font", ""),
                                    "size": span.get("size", 0),
                                })
                
                pages_text.append({
                    "page_number": page_num + 1,
                    "text": text,
                    "text_blocks": text_blocks,
                    "has_text": len(text.strip()) > 0,
                })
            
            doc.close()
            return pages_text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return []
    
    async def ocr_image(
        self,
        image_bytes: bytes,
        page_number: int = 1
    ) -> Dict[str, Any]:
        """
        Perform OCR on an image using Tesseract.
        
        Returns:
            Dict with text, confidence, and word-level data
        """
        if not HAS_TESSERACT or not HAS_PIL:
            logger.warning("OCR dependencies not available")
            return {
                "page_number": page_number,
                "text": "",
                "confidence": 0,
                "words": [],
            }
        
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Get detailed OCR data
            ocr_data = pytesseract.image_to_data(
                image,
                lang=self.tesseract_lang,
                output_type=pytesseract.Output.DICT
            )
            
            # Calculate overall confidence
            confidences = [
                int(c) for c in ocr_data.get("conf", []) 
                if str(c).isdigit() and int(c) > 0
            ]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Extract words with positions
            words = []
            n_boxes = len(ocr_data.get("text", []))
            for i in range(n_boxes):
                word = ocr_data["text"][i].strip()
                if word:
                    words.append({
                        "text": word,
                        "confidence": int(ocr_data["conf"][i]),
                        "bbox": {
                            "x": ocr_data["left"][i],
                            "y": ocr_data["top"][i],
                            "width": ocr_data["width"][i],
                            "height": ocr_data["height"][i],
                        },
                    })
            
            # Full text
            full_text = pytesseract.image_to_string(image, lang=self.tesseract_lang)
            
            return {
                "page_number": page_number,
                "text": full_text,
                "confidence": avg_confidence,
                "words": words,
            }
            
        except Exception as e:
            logger.error(f"OCR error on page {page_number}: {e}")
            return {
                "page_number": page_number,
                "text": "",
                "confidence": 0,
                "words": [],
                "error": str(e),
            }
    
    async def process_pdf(
        self,
        pdf_content: bytes,
        force_ocr: bool = False
    ) -> Dict[str, Any]:
        """
        Full PDF processing: native text extraction + OCR fallback.
        
        Args:
            pdf_content: PDF file bytes
            force_ocr: Always use OCR even if PDF has text layer
            
        Returns:
            Complete extraction result with text and metadata
        """
        result = {
            "page_count": 0,
            "pages": [],
            "full_text": "",
            "average_confidence": 0,
            "extraction_method": "native",
        }
        
        try:
            # Get page count
            result["page_count"] = await self.get_page_count(pdf_content)
            
            # Try native extraction first
            native_pages = await self.extract_text_native(pdf_content)
            
            # Check if native extraction got text
            has_native_text = any(
                len(p.get("text", "").strip()) > 50 
                for p in native_pages
            )
            
            if has_native_text and not force_ocr:
                # Use native extraction
                result["extraction_method"] = "native"
                result["pages"] = native_pages
                result["full_text"] = "\n\n".join(
                    p.get("text", "") for p in native_pages
                )
                result["average_confidence"] = 95.0  # Native extraction is reliable
            else:
                # Fall back to OCR
                result["extraction_method"] = "ocr"
                images = await self.pdf_to_images(pdf_content)
                
                ocr_results = []
                for i, img in enumerate(images):
                    ocr_page = await self.ocr_image(img, page_number=i + 1)
                    ocr_results.append(ocr_page)
                
                result["pages"] = ocr_results
                result["full_text"] = "\n\n".join(
                    p.get("text", "") for p in ocr_results
                )
                
                # Calculate average confidence from OCR
                confidences = [
                    p.get("confidence", 0) 
                    for p in ocr_results 
                    if p.get("confidence", 0) > 0
                ]
                result["average_confidence"] = (
                    sum(confidences) / len(confidences) if confidences else 0
                )
            
            return result
            
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            result["error"] = str(e)
            return result


# Global instance
pdf_processor = PDFProcessor()
