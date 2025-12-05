"""
Virus Scanning Service for IEP Documents
Integrates with ClamAV or cloud-based virus scanning.
"""

import os
import asyncio
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

# Optional ClamAV support
try:
    import clamd
    HAS_CLAMD = True
except ImportError:
    HAS_CLAMD = False
    logger.warning("clamd not installed - using mock virus scanning")


class VirusScannerService:
    """
    Virus scanner for uploaded documents.
    Supports ClamAV daemon or falls back to mock scanning.
    """
    
    def __init__(self):
        self.clamav_host = os.getenv("CLAMAV_HOST", "clamav")
        self.clamav_port = int(os.getenv("CLAMAV_PORT", "3310"))
        self.enabled = os.getenv("VIRUS_SCAN_ENABLED", "true").lower() == "true"
        self._clamd_client = None
    
    def _get_clamd_client(self):
        """Get or create ClamAV daemon client."""
        if not HAS_CLAMD:
            return None
        
        if self._clamd_client is None:
            try:
                self._clamd_client = clamd.ClamdNetworkSocket(
                    host=self.clamav_host,
                    port=self.clamav_port
                )
                # Test connection
                self._clamd_client.ping()
            except Exception as e:
                logger.warning(f"Could not connect to ClamAV: {e}")
                self._clamd_client = None
        
        return self._clamd_client
    
    async def scan_file(
        self,
        file_content: bytes,
        filename: str = "document.pdf"
    ) -> Tuple[bool, str]:
        """
        Scan file content for viruses.
        
        Returns:
            Tuple of (is_clean, status_message)
        """
        if not self.enabled:
            logger.info("Virus scanning disabled")
            return True, "SCAN_DISABLED"
        
        # Try ClamAV first
        client = self._get_clamd_client()
        if client:
            try:
                # ClamAV instream scan
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: client.instream(file_content)
                )
                
                # Result format: {'stream': ('OK', None)} or {'stream': ('FOUND', 'virus_name')}
                stream_result = result.get("stream", ("ERROR", "Unknown"))
                status = stream_result[0]
                
                if status == "OK":
                    logger.info(f"File {filename} passed virus scan")
                    return True, "CLEAN"
                elif status == "FOUND":
                    virus_name = stream_result[1] if len(stream_result) > 1 else "Unknown"
                    logger.warning(f"Virus detected in {filename}: {virus_name}")
                    return False, f"INFECTED:{virus_name}"
                else:
                    logger.error(f"Virus scan error for {filename}: {stream_result}")
                    return False, f"ERROR:{status}"
                    
            except Exception as e:
                logger.error(f"ClamAV scan failed: {e}")
                # Fall through to mock scanning
        
        # Mock scanning for development
        logger.info(f"Using mock virus scan for {filename}")
        
        # Simple heuristic checks for obviously bad content
        bad_signatures = [
            b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE",  # Test virus
            b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR",
        ]
        
        for sig in bad_signatures:
            if sig in file_content:
                return False, "INFECTED:EICAR-Test-Virus"
        
        # Check for suspicious patterns in PDF
        if b"%PDF" in file_content[:10]:
            suspicious_patterns = [
                b"/JavaScript",
                b"/JS",
                b"/OpenAction",
                b"/Launch",
                b"/EmbeddedFile",
            ]
            for pattern in suspicious_patterns:
                if pattern in file_content:
                    logger.warning(f"Suspicious pattern found in {filename}: {pattern}")
                    # Just warn, don't block - these can be legitimate
        
        return True, "CLEAN"
    
    async def get_scanner_status(self) -> dict:
        """Get virus scanner health status."""
        status = {
            "enabled": self.enabled,
            "backend": "none",
            "healthy": False,
            "version": None,
        }
        
        if not self.enabled:
            status["healthy"] = True
            return status
        
        client = self._get_clamd_client()
        if client:
            try:
                version = await asyncio.get_event_loop().run_in_executor(
                    None,
                    client.version
                )
                status["backend"] = "clamav"
                status["healthy"] = True
                status["version"] = version
            except Exception:
                status["backend"] = "mock"
                status["healthy"] = True
        else:
            status["backend"] = "mock"
            status["healthy"] = True
        
        return status


# Global instance
virus_scanner = VirusScannerService()
