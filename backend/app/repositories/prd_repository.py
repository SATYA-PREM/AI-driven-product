"""
prd_repository.py
-----------------
MongoDB repository for PRD projects, contexts, documents, requirements,
user stories, features, phases, development tasks, review gates, and version history.
"""

from __future__ import annotations
from typing import Any, List, Dict, Optional
from bson import ObjectId

from app.repositories.base_repository import BaseRepository
from app.core.database import (
    prd_projects_collection,
    prd_generation_context_collection,
    prd_documents_collection,
    prd_requirements_collection,
    user_stories_collection,
    acceptance_criteria_collection,
    prd_features_collection,
    feature_prioritization_collection,
    product_phases_collection,
    development_tasks_collection,
    prd_reviews_collection,
    prd_versions_collection,
    ai_generation_runs_collection,
    rendered_documents_collection,
)


class PRDRepository(BaseRepository):

    def __init__(self):
        super().__init__(prd_projects_collection)

    # --- Projects ---
    def create_project(self, doc: dict[str, Any]) -> str:
        res = prd_projects_collection.insert_one(doc)
        return str(res.inserted_id)

    def find_project_by_prd_id(self, prd_id: str) -> Optional[dict[str, Any]]:
        return prd_projects_collection.find_one({"$or": [{"prd_id": prd_id}, {"_id": prd_id}]})

    def list_projects_by_workspace(
        self,
        workspace_id: str,
        dataset_id: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"workspace_id": workspace_id}
        if dataset_id:
            query["$or"] = [{"dataset_id": dataset_id}, {"dataset_id": str(dataset_id)}]
        if source_type and source_type != "all":
            query["source_type"] = source_type
        return list(prd_projects_collection.find(query).sort("created_at", -1))

    def update_project(self, prd_id: str, update_data: dict[str, Any]) -> bool:
        clean = {k: v for k, v in update_data.items() if k not in ["_id", "id"]}
        res = prd_projects_collection.update_one({"$or": [{"prd_id": prd_id}, {"_id": prd_id}]}, {"$set": clean})
        return res.matched_count > 0

    # --- Generation Context Snapshot ---
    def save_generation_context(self, context_doc: dict[str, Any]) -> str:
        prd_generation_context_collection.delete_many({"prd_id": context_doc["prd_id"]})
        res = prd_generation_context_collection.insert_one(context_doc)
        return str(res.inserted_id)

    def get_generation_context(self, prd_id: str) -> Optional[dict[str, Any]]:
        return prd_generation_context_collection.find_one({"prd_id": prd_id})

    # --- Documents ---
    def save_document(self, doc: dict[str, Any]) -> str:
        clean_doc = {k: v for k, v in doc.items() if k != "_id"}
        prd_documents_collection.delete_many({"prd_id": clean_doc["prd_id"], "version": clean_doc.get("version", "v1.0")})
        res = prd_documents_collection.insert_one(clean_doc)
        return str(res.inserted_id)

    def get_document(self, prd_id: str, version: Optional[str] = None) -> Optional[dict[str, Any]]:
        query: dict[str, Any] = {"prd_id": prd_id}
        if version:
            query["version"] = version
        return prd_documents_collection.find_one(query, sort=[("created_at", -1), ("_id", -1)])

    # --- Requirements ---
    def save_requirements(self, prd_id: str, reqs: list[dict[str, Any]]) -> None:
        prd_requirements_collection.delete_many({"prd_id": prd_id})
        if reqs:
            prd_requirements_collection.insert_many(reqs)

    def get_requirements(self, prd_id: str) -> list[dict[str, Any]]:
        return list(prd_requirements_collection.find({"prd_id": prd_id}))

    # --- User Stories & Acceptance Criteria ---
    def save_user_stories(self, prd_id: str, stories: list[dict[str, Any]]) -> None:
        user_stories_collection.delete_many({"prd_id": prd_id})
        if stories:
            user_stories_collection.insert_many(stories)

    def get_user_stories(self, prd_id: str) -> list[dict[str, Any]]:
        return list(user_stories_collection.find({"prd_id": prd_id}))

    def save_acceptance_criteria(self, req_id: str, criteria_list: list[dict[str, Any]]) -> None:
        acceptance_criteria_collection.delete_many({"requirement_id": req_id})
        if criteria_list:
            acceptance_criteria_collection.insert_many(criteria_list)

    def get_acceptance_criteria_by_prd(self, prd_id: str) -> list[dict[str, Any]]:
        reqs = self.get_requirements(prd_id)
        req_ids = [r.get("requirement_id") for r in reqs if r.get("requirement_id")]
        return list(acceptance_criteria_collection.find({"requirement_id": {"$in": req_ids}}))

    # --- Features & Prioritization ---
    def save_features(self, prd_id: str, features: list[dict[str, Any]]) -> None:
        prd_features_collection.delete_many({"prd_id": prd_id})
        if features:
            prd_features_collection.insert_many(features)

    def get_features(self, prd_id: str) -> list[dict[str, Any]]:
        return list(prd_features_collection.find({"prd_id": prd_id}))

    def save_prioritization(self, feature_id: str, prio_doc: dict[str, Any]) -> None:
        feature_prioritization_collection.delete_many({"feature_id": feature_id})
        feature_prioritization_collection.insert_one(prio_doc)

    # --- Phases & Development Tasks ---
    def save_phases(self, prd_id: str, phases: list[dict[str, Any]]) -> None:
        product_phases_collection.delete_many({"prd_id": prd_id})
        if phases:
            product_phases_collection.insert_many(phases)

    def get_phases(self, prd_id: str) -> list[dict[str, Any]]:
        return list(product_phases_collection.find({"prd_id": prd_id}))

    def save_tasks(self, prd_id: str, tasks: list[dict[str, Any]]) -> None:
        # Delete tasks linked to prd_id phases or story ids
        stories = self.get_user_stories(prd_id)
        story_ids = [s.get("story_id") for s in stories if s.get("story_id")]
        development_tasks_collection.delete_many({"story_id": {"$in": story_ids}})
        if tasks:
            development_tasks_collection.insert_many(tasks)

    def get_tasks(self, prd_id: str) -> list[dict[str, Any]]:
        stories = self.get_user_stories(prd_id)
        story_ids = [s.get("story_id") for s in stories if s.get("story_id")]
        return list(development_tasks_collection.find({"story_id": {"$in": story_ids}}))

    # --- Reviews & Versions ---
    def add_review(self, review_doc: dict[str, Any]) -> str:
        res = prd_reviews_collection.insert_one(review_doc)
        return str(res.inserted_id)

    def get_reviews(self, prd_id: str) -> list[dict[str, Any]]:
        return list(prd_reviews_collection.find({"prd_id": prd_id}).sort("created_at", -1))

    def add_version(self, version_doc: dict[str, Any]) -> str:
        res = prd_versions_collection.insert_one(version_doc)
        return str(res.inserted_id)

    def get_versions(self, prd_id: str) -> list[dict[str, Any]]:
        return list(prd_versions_collection.find({"prd_id": prd_id}).sort("created_at", -1))

    # --- AI Run Telemetry ---
    def log_ai_run(self, run_doc: dict[str, Any]) -> str:
        res = ai_generation_runs_collection.insert_one(run_doc)
        return str(res.inserted_id)

    def get_ai_run(self, prd_id: str) -> Optional[dict[str, Any]]:
        return ai_generation_runs_collection.find_one({"prd_id": prd_id})

    def get_ai_runs_by_workspace(self, workspace_id: str) -> list[dict[str, Any]]:
        return list(ai_generation_runs_collection.find({"workspace_id": workspace_id}).sort("generated_at", -1))


prd_repository = PRDRepository()

