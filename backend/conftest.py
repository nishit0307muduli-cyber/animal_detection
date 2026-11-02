"""
Pytest configuration for the Railway Animal Detection backend tests.

Sets PYTHONPATH so that `app.*` imports resolve correctly when pytest is
run from the `backend/` directory.
"""
import sys
from pathlib import Path

# Make the backend directory the package root so 'app' is importable.
sys.path.insert(0, str(Path(__file__).parent))
