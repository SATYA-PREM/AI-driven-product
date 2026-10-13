"""
database.py
-------------
MongoDB connection management and collection accessors.
Provides resilient initialization for local, cloud (Atlas), and test environments.
"""

from __future__ import annotations

import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def configure_dns_resolver() -> None:
    """
    Ensure dnspython uses fast and reliable DNS servers for MongoDB Atlas SRV resolution.
    On some Windows environments/ISPs, default 8.8.8.8:53 queries time out, causing
    Atlas connection initialization failures. Adding 1.1.1.1 resolves this instantly.
    """
    try:
        import dns.resolver

        resolver = dns.resolver.Resolver(configure=True)
        preferred = ["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]
        existing = [ns for ns in resolver.nameservers if ns not in preferred]
        resolver.nameservers = preferred + existing
        resolver.timeout = 4.0
        resolver.lifetime = 10.0
        dns.resolver.default_resolver = resolver
    except Exception as e:
        logger.debug(f"Could not custom configure DNS resolver: {e}")


# Run initial DNS resolver setup
configure_dns_resolver()


class DatabaseManager:
    """Manages lazy and resilient MongoDB connection."""

    def __init__(self):
        self._client: MongoClient | None = None
        self._db: Database | None = None

    @property
    def client(self) -> MongoClient:
        if self._client is None:
            configure_dns_resolver()
            try:
                self._client = MongoClient(
                    settings.MONGODB_URL,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000,
                    socketTimeoutMS=20000,
                    minPoolSize=2,
                    maxPoolSize=25,
                    maxIdleTimeMS=60000,
                    retryWrites=True,
                )
            except Exception as e:
                logger.error(f"Could not initialize MongoDB client for {settings.MONGODB_URL}: {e}")
                if "localhost" in settings.MONGODB_URL or "127.0.0.1" in settings.MONGODB_URL:
                    self._client = MongoClient(serverSelectionTimeoutMS=2000, minPoolSize=1)
                else:
                    raise
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

# Milestone 2 Collections
analyses_collection: Collection = CollectionProxy("analyses")
issue_clusters_collection: Collection = CollectionProxy("issue_clusters")
feature_clusters_collection: Collection = CollectionProxy("feature_clusters")
trends_collection: Collection = CollectionProxy("trends")
theme_patterns_collection: Collection = CollectionProxy("theme_patterns")
product_insights_collection: Collection = CollectionProxy("product_insights")
ai_jobs_collection: Collection = CollectionProxy("ai_jobs")
reports_collection: Collection = CollectionProxy("reports")
activities_collection: Collection = CollectionProxy("activities")
product_features_collection: Collection = CollectionProxy("product_features")
customer_feedback_collection: Collection = CollectionProxy("customer_feedback")

# Milestone 3 Collections (PRD Lifecycle & Traceability)
prd_projects_collection: Collection = CollectionProxy("prd_projects")
prd_generation_context_collection: Collection = CollectionProxy("prd_generation_context")
prd_documents_collection: Collection = CollectionProxy("prd_documents")
prd_requirements_collection: Collection = CollectionProxy("prd_requirements")
user_stories_collection: Collection = CollectionProxy("user_stories")
acceptance_criteria_collection: Collection = CollectionProxy("acceptance_criteria")
prd_features_collection: Collection = CollectionProxy("prd_features")
feature_prioritization_collection: Collection = CollectionProxy("feature_prioritization")
product_phases_collection: Collection = CollectionProxy("product_phases")
development_tasks_collection: Collection = CollectionProxy("development_tasks")
prd_reviews_collection: Collection = CollectionProxy("prd_reviews")
prd_versions_collection: Collection = CollectionProxy("prd_versions")
ai_generation_runs_collection: Collection = CollectionProxy("ai_generation_runs")
rendered_documents_collection: Collection = CollectionProxy("rendered_documents")

# Milestone 4 Collections (PRD Team Assignments & Downstream Handoff)
prd_assignments_collection: Collection = CollectionProxy("prd_assignments")
prd_assignment_jobs_collection: Collection = CollectionProxy("prd_assignment_jobs")
prd_assignment_recommendations_collection: Collection = CollectionProxy("prd_assignment_recommendations")
prd_assignment_history_collection: Collection = CollectionProxy("prd_assignment_history")

# AI Assistant Collections (Read-only Intelligence Layer)
assistant_sessions_collection: Collection = CollectionProxy("assistant_sessions")
assistant_messages_collection: Collection = CollectionProxy("assistant_messages")
assistant_jobs_collection: Collection = CollectionProxy("assistant_jobs")


# ──────────────────────────────────────────────
# Initialization & Lifecycle
# ──────────────────────────────────────────────

_indexes_initialized = False

def initialize_database() -> None:
    """Create indexes for all collections on startup."""
    global _indexes_initialized
    if _indexes_initialized:
        logger.debug("Database indexes already initialized for current runtime.")
        return

    try:
        logger.info("Initializing database indexes...")
        if not check_connection():
            logger.warning("MongoDB ping failed. Skipping initial index creation until connection is established.")
            return

        _indexes_initialized = True
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

        # Milestone 2 indexes
        analyses_collection.create_index([("dataset_id", ASCENDING), ("feedback_id", ASCENDING)], unique=True)
        analyses_collection.create_index("workspace_id")
        issue_clusters_collection.create_index("workspace_id")
        issue_clusters_collection.create_index("dataset_id")
        feature_clusters_collection.create_index("workspace_id")
        feature_clusters_collection.create_index("dataset_id")
        trends_collection.create_index("workspace_id")
        reports_collection.create_index("workspace_id")
        reports_collection.create_index("dataset_id")
        trends_collection.create_index("dataset_id")
        theme_patterns_collection.create_index("workspace_id")
        theme_patterns_collection.create_index("dataset_id")
        product_insights_collection.create_index("workspace_id")
        product_insights_collection.create_index("dataset_id")
        product_features_collection.create_index("workspace_id")
        product_features_collection.create_index("feature_id")
        product_features_collection.create_index("status")
        customer_feedback_collection.create_index("workspace_id")
        customer_feedback_collection.create_index("feedback_id")
        customer_feedback_collection.create_index("status")
        customer_feedback_collection.create_index("sentiment")
        customer_feedback_collection.create_index("category")
        ai_jobs_collection.create_index("job_id", unique=True)
        ai_jobs_collection.create_index("dataset_id")

        # Milestone 3 & 4 indexes (PRD & Assignments)
        prd_projects_collection.create_index("workspace_id")
        prd_projects_collection.create_index("prd_id", unique=True)
        prd_requirements_collection.create_index("prd_id")
        prd_requirements_collection.create_index("requirement_id")
        
        prd_assignments_collection.create_index("workspace_id")
        prd_assignments_collection.create_index([("workspace_id", ASCENDING), ("category_id", ASCENDING)])
        prd_assignments_collection.create_index("prd_id")
        prd_assignments_collection.create_index([("prd_id", ASCENDING), ("requirement_id", ASCENDING)])
        prd_assignments_collection.create_index("requirement_id")
        prd_assignments_collection.create_index("user_id")
        prd_assignments_collection.create_index("status")
        prd_assignments_collection.create_index("assignment_id", unique=True)
        prd_assignments_collection.create_index(
            [("requirement_id", ASCENDING), ("user_id", ASCENDING), ("team_role", ASCENDING)],
            unique=True
        )

        prd_assignment_jobs_collection.create_index("job_id", unique=True)
        prd_assignment_jobs_collection.create_index("workspace_id")
        prd_assignment_jobs_collection.create_index("status")

        prd_assignment_recommendations_collection.create_index("job_id")
        prd_assignment_recommendations_collection.create_index("prd_id")
        prd_assignment_recommendations_collection.create_index("requirement_id")
        prd_assignment_recommendations_collection.create_index("recommendation_id", unique=True)

        prd_assignment_history_collection.create_index("assignment_id")
        prd_assignment_history_collection.create_index("requirement_id")

        logger.info("Database indexes initialized successfully")

        # Automatic migration: backfill legacy datasets missing dataset_name or name
        try:
            missing_cursor = datasets_collection.find({
                "$or": [
                    {"dataset_name": None},
                    {"dataset_name": {"$exists": False}},
                    {"name": None},
                    {"name": {"$exists": False}},
                ]
            })
            backfill_count = 0
            for doc in missing_cursor:
                fallback_name = doc.get("dataset_name") or doc.get("name") or doc.get("filename") or f"Dataset {str(doc.get('_id', ''))[-6:]}"
                datasets_collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"dataset_name": fallback_name, "name": fallback_name}}
                )
                backfill_count += 1
            if backfill_count > 0:
                logger.info(f"Auto-backfilled {backfill_count} legacy datasets with dataset_name/name")
        except Exception as mig_err:
            logger.warning(f"Legacy dataset auto-backfill notice: {mig_err}")
    except Exception as e:
        logger.warning(f"Database indexing skipped (offline or unreachable): {e}")


def check_connection() -> bool:
    """Ping MongoDB to verify if database is reachable."""
    try:
        configure_dns_resolver()
        db_manager.client.admin.command("ping")
        return True
    except Exception as e:
        logger.debug(f"MongoDB ping check failed: {e}")
        return False


def get_database() -> Database:
    return db_manager.db


def get_users_collection() -> Collection:
    return users_collection
