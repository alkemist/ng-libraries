export interface BasicUser {
  id: number | null,
  name: string
}

export type USER_GROUP = "USER" | "ADMIN" | "SUPERADMIN";

export interface UserProfile {
  username: string,
  avatar: string | null,
  badges: string[],
}

export interface UserRights {
  viewProfile: boolean,
  viewUsers: boolean
}

export interface ComplexeUser extends BasicUser {
  groups: USER_GROUP[],
  profiles: UserProfile[]
  rights: UserRights
}
