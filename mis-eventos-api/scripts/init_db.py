import getpass
from app.config import settings
from app.models.user import User
from app.utils.enums import UserRole
from app.utils.security import hash_password
from sqlmodel import Session, create_engine


def init_db():
    # Usar driver síncrono para este script de mantenimiento
    db_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
    engine = create_engine(db_url)

    with Session(engine) as session:
        # Verificar si ya existe un admin
        from sqlmodel import select

        statement = select(User).where(User.role == UserRole.ADMIN)
        existing_admin = session.exec(statement).first()

        if existing_admin:
            print("❌ Ya existe un usuario administrador")
            return

        # Solicitar contraseña segura
        while True:
            password = getpass.getpass("Ingrese la contraseña para el administrador: ")
            if len(password) < 8:
                print("⚠️  La contraseña debe tener al menos 8 caracteres.")
                continue
            confirm_password = getpass.getpass("Confirme la contraseña: ")
            if password != confirm_password:
                print("❌ Las contraseñas no coinciden. Intente de nuevo.")
                continue
            break

        # Crear admin
        admin = User(
            email="admin@miseventos.com",
            full_name="Administrador",
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )

        session.add(admin)
        session.commit()
        session.refresh(admin)

        print("✅ Usuario administrador creado exitosamente")
        print(f"   Email: {admin.email}")
        print(f"   ⚠️  Recuerda esta contraseña, no se puede recuperar fácilmente.")


if __name__ == "__main__":
    init_db()
