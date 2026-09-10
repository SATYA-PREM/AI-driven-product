"""
database.py
-------------
MongoDB connection management and collection accessors.
Provides resilient initialization for local, cloud, and test environments.
"""

from __future__ import annotations

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class DatabaseManager:
    """Manages lazy and resilient MongoDB connection."""

    def __init__(self):
        self._client: MongoClient | None = None
        self._db: Database | None = None

    @property
    def client(self) -> MongoClient:
        if self._client is None:
            try:
                self._client = MongoClient(
                    settings.MONGODB_URL,
                    serverSelectionTimeoutMS=2000,
                    connectTimeoutMS=2000,
                    socketTimeoutMS=2000
                )
            except Exception as e:
                logger.warning(f"Could not initialize primary MongoDB connection: {e}")
                # Fallback to local default client to avoid module-level import crashes
                self._client = MongoClient(serverSelectionTimeoutMS=1000)
        return self._client

    @property
    def db(self) -> Database:
        if self._db is None:
            self._db = self.client[settings.MONGODB_DATABASE]
        return self._db

    def get_collection(self, name: str) -> Collection:
        return self.db[name]


db_manager = DatabaseManager()


class CollectionProxy:
    """Proxy object that defers collection resolution until method invocation."""

    def __init__(self, collection_name: str):
        self._collection_name = collection_name

    def __getattr__(self, name: str):
        col = db_manager.get_collection(self._collection_name)
        return getattr(col, name)


# ──────────────────────────────────────────────
# Collection Accessors (Proxied)
# ──────────────────────────────────────────────

users_collection: Collection = CollectionProxy("users")
workspaces_collection: Collection = CollectionProxy("workspaces")
workspace_members_collection: Collection = CollectionProxy("workspace_members")
products_collection: Collection = CollectionProxy("products")
datasets_collection: Collection = CollectionProxy("datasets")
raw_data_collection: Collection = CollectionProxy("raw_data")
validation_results_collection: Collection = CollectionProxy("validation_results")
cleaned_data_collection: Collection = CollectionProxy("cleaned_data")
processed_data_collection: Collection = CollectionProxy("processed_data")
processing_jobs_collection: Collection = CollectionProxy("processing_jobs")
workflows_collection: Collection = CollectionProxy("workflows")

batches_col: Collection = CollectionProxy("batches")
raw_data_col: Collection = CollectionProxy("csv_raw_data")
cleaned_data_col: Collection = CollectionProxy("csv_cleaned_data")


# ──────────────────────────────────────────────
# Initialization & Lifecycle
# ──────────────────────────────────────────────

def initialize_database() -> None:
    """Create indexes for all collections on startup."""
    try:
        logger.info("Initializing database indexes...")
        users_collection.create_index("email", unique=True)
        workspaces_collection.create_index("owner_id")
        workspace_members_collection.create_index(
            [("workspace_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
        )
        products_collection.create_index("workspace_id")
        datasets_collection.create_index("workspace_id")
        datasets_collection.create_index("product_id")
        raw_data_collection.create_index("dataset_id")
        validation_results_collection.create_index("dataset_id", unique=True)
        cleaned_data_collection.create_index("dataset_id")
        processed_data_collection.create_index("dataset_id")
        processing_jobs_collection.create_index("dataset_id")
        workflows_collection.create_index("workspace_id")
        logger.info("Database indexes initialized successfully")
    except Exception as e:
        logger.warning(f"Database indexing skipped (offline or unreachable): {e}")


def check_connection() -> bool:
    """Ping MongoDB to verify if database is reachable."""
    try:
        db_manager.client.admin.command("ping")
        return True
    except Exception as e:
        logger.debug(f"MongoDB ping check failed: {e}")
        return False


def get_database() -> Database:
    return db_manager.db


def get_users_collection() -> Collection:
    return users_collection
