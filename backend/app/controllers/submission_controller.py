from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.tracking_exceptions import (
    AtividadeNaoEncontradaError,
    EntregaIndisponivelError,
    EntregaJaExistenteError,
)
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.submission_repository import SubmissionRepository
from app.schemas.tracking_schema import SubmissionCreateRequest, SubmissionResponse
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.submission_service import SubmissionService


router = APIRouter(prefix="/assignments", tags=["Submissions"])


def get_submission_service(db: Session = Depends(get_db)):
    return SubmissionService(SubmissionRepository(db), AssignmentRepository(db))


def get_student_repository(db: Session = Depends(get_db)):
    return StudentRepository(db)


def get_assignment_repository(db: Session = Depends(get_db)):
    return AssignmentRepository(db)


@router.post("/{public_id}/submissions", response_model=SubmissionResponse)
def submit_assignment(
    public_id: str,
    data: SubmissionCreateRequest,
    current_user=Depends(get_current_user),
    student_repository: StudentRepository = Depends(get_student_repository),
    assignment_repository: AssignmentRepository = Depends(get_assignment_repository),
    service: SubmissionService = Depends(get_submission_service)
):
    student = student_repository.find_by_user_id(current_user.id)
    if not student:
        raise HTTPException(status_code=403, detail="Apenas alunos podem enviar atividades")

    assignment = assignment_repository.find_by_public_id(public_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    try:
        return service.submit(assignment.id, student.id, data.content)
    except AtividadeNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except EntregaIndisponivelError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except EntregaJaExistenteError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/{public_id}/submissions", response_model=list[SubmissionResponse])
def list_submissions(
    public_id: str,
    admin=Depends(require_admin),
    assignment_repository: AssignmentRepository = Depends(get_assignment_repository),
    service: SubmissionService = Depends(get_submission_service)
):
    assignment = assignment_repository.find_by_public_id(public_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")

    return service.list_for_assignment(assignment.id)