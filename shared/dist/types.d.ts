export type UserRole = 'admin' | 'user';
export type AuthProvider = 'local' | 'google' | 'both';
export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    auth_provider: AuthProvider;
    is_active: boolean;
    created_by?: string;
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
}
export interface CreateUserDto {
    username: string;
    email: string;
    password?: string;
    role: UserRole;
    auth_provider?: AuthProvider;
}
export interface UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    is_active?: boolean;
}
export interface LoginDto {
    username: string;
    password: string;
}
export interface GoogleLoginDto {
    idToken: string;
}
export interface AuthResponse {
    token: string;
    user: Omit<User, 'password_hash'>;
}
export interface Password {
    id: string;
    guid: string;
    title?: string;
    created_by: string;
    expires_at?: Date;
    max_access_count?: number;
    current_access_count: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreatePasswordDto {
    password: string;
    title?: string;
    expires_at?: Date;
    max_access_count?: number;
}
export interface RetrievePasswordResponse {
    password: string;
    title?: string;
    created_at: Date;
    expires_at?: Date;
    max_access_count?: number;
    current_access_count: number;
    remaining_accesses?: number;
}
export interface PasswordListItem {
    id: string;
    guid: string;
    title?: string;
    created_at: Date;
    expires_at?: Date;
    max_access_count?: number;
    current_access_count: number;
    is_active: boolean;
    shareable_link: string;
}
export type AccessType = 'view' | 'create' | 'delete';
export interface AccessLog {
    id: string;
    password_id: string;
    accessed_by?: string;
    ip_address: string;
    user_agent: string;
    access_type: AccessType;
    success: boolean;
    created_at: Date;
}
export interface PasswordGeneratorOptions {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
}
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';
export interface PasswordGenerationResult {
    password: string;
    strength: PasswordStrength;
}
export interface AdminStats {
    total_users: number;
    active_users: number;
    total_passwords: number;
    active_passwords: number;
    total_accesses: number;
    accesses_today: number;
    accesses_this_week: number;
    accesses_this_month: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
