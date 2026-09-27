from sqlalchemy import inspect

from app.config.settings import DATABASE_URL
from app.database.connection import Base, engine
import app.models  # garante que todos os models sejam registrados antes do create_all


def mask_password(url: str) -> str:
    if "@" not in url:
        return url
    prefix, rest = url.split("@", 1)
    if ":" not in prefix:
        return url
    scheme_user, _ = prefix.rsplit(":", 1)
    return f"{scheme_user}:***@{rest}"


print(f"Conectando em: {mask_password(DATABASE_URL)}")

Base.metadata.create_all(bind=engine)

inspector = inspect(engine)
tables = inspector.get_table_names()

print(f"Tabelas existentes depois do create_all ({len(tables)}):")
for table in sorted(tables):
    print(f"  - {table}")

if not tables:
    raise RuntimeError(
        "Nenhuma tabela foi criada. Verifique se app/models/__init__.py "
        "importa todos os models, ou se algum import está falhando silenciosamente."
    )