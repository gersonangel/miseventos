from enum import Enum


class UserRole(str, Enum):

    ADMIN = "admin"
    ORGANIZER = "organizer"
    ATTENDEE = "attendee"
