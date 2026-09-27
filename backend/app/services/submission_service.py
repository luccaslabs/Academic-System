from app.exceptions.tracking_exceptions import (
    AtividadeNaoEncontradaError,
    EntregaIndisponivelError,
)
from app.models.submission import Submission
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.submission_repository import SubmissionRepository


class SubmissionService:

    def __init__(self, repository: SubmissionRepository, assignment_repository: AssignmentRepository):
        self.repository = repository
        self.assignment_repository = assignment_repository

    def submit(self, assignment_id: int, student_id: int, content: str):

        assignment = self.assignment_repository.find_by_id(assignment_id)
        if not assignment:
            raise AtividadeNaoEncontradaError("Atividade não encontrada")

        if not assignment.accepts_submissions:
            raise EntregaIndisponivelError("Essa atividade não aceita envio pelo sistema")

        submission = Submission(assignment_id=assignment_id, student_id=student_id, content=content)

        return self.repository.create(submission)

    def list_for_assignment(self, assignment_id: int):
        return self.repository.find_by_assignment(assignment_id)