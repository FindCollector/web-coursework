package com.fitness_centre.constant;

/**
 * @author
 * @Classname ErrorCode
 * @Description TODO
 * @date 29/03/2025
 */
public enum ErrorCode {
    /**
     * Success: typically indicates a successful operation or request
     */
    SUCCESS(0, "success"),

    /**
     * ============= 1xxx: System and unknown errors =============
     */
    SYSTEM_ERROR(1000, "System busy, please try again later"),
    UNKNOWN_ERROR(1001, "Unknown error"),
    DB_OPERATION_ERROR(1002, "Database operation error"),
    NETWORK_ERROR(1003, "Network exception"),
    CACHE_ERROR(1004, "Cache operation failed"),

    /**
     * ============= 2xxx: Parameter validation and input errors =============
     */
    VALIDATION_ERROR(2000, "Request parameter validation failure"),
    MISSING_PARAMETER(2001, "Missing required parameters"),
    INVALID_PARAMETER(2002, "Invalid parameter"),

    /**
     * ============= 3xxx: Authentication and permission related errors =============
     */
    UNAUTHORIZED(3000, "Not logged in or login expired"),
    FORBIDDEN(3001, "Unauthorized access"),
    TOKEN_INVALID(3002, "Invalid TOKEN or TOKEN has expired"),
    CAPTCHA_ERROR(3003, "Suspected robot"),

    EMAIL_NOT_BOUND(3004,"Need to bound email with basic information"),

    GOOGLE_AUTH_ERROR(3005,"Google auth error"),
    GOOGLE_EMAIL_ALREADY_EXISTS(3006,"Google email already exist"),

    /**
     * User-related errors (41xx)
     */
    USER_NOT_FOUND(4100, "User not found"),
    USER_ALREADY_EXISTS(4101, "User already exists"),
    USER_INFO_EXPIRED(4102, "User information has expired"),
    EMAIL_ALREADY_REGISTERED(4103, "Email already registered"),
    INVALID_EMAIL_FORMAT(4104, "Invalid email format"),
    USERNAME_ALREADY_TAKEN(4105, "Username already taken"),
    PASSWORD_TOO_WEAK(4106, "Password does not meet strength requirements"),
    PASSWORDS_DO_NOT_MATCH(4107, "Passwords do not match"),
    EMAIL_VERIFICATION_FAILED(4108, "Email verification failed"),
    TOO_MANY_REQUESTS(4109, "Too many requests"),
    REGISTRATION_INCOMPLETE(4110, "Registration process incomplete"),
    PROFILE_UPDATE_FAILED(4111, "Failed to update user profile"),

    PROFILE_UNFINISHED(4112, "You have incomplete personal information"),

    /**
     * External service errors (50xx)
     */
    EXTERNAL_SERVICE_ERROR(5000, "External service error"),
    EMAIL_SERVICE_ERROR(5001, "Email service error"),
    PAYMENT_SERVICE_ERROR(5002, "Payment service error"),
    NOTIFICATION_SERVICE_ERROR(5003, "Notification service error"),
    FILE_SERVICE_ERROR(5004, "File service error"),
    API_INTEGRATION_ERROR(5005, "Third-party API integration error"),

    BUSINESS_FAILED(9000, "Operation failed"),
    OPERATION_TIMEOUT(9001, "Operation timed out"),
    RATE_LIMIT_EXCEEDED(9002, "Rate limit exceeded"),
    RESOURCE_UNAVAILABLE(9003, "Resource temporarily unavailable"),
    FEATURE_UNAVAILABLE(9004, "Feature temporarily unavailable"),
    MAINTENANCE_MODE(9005, "System is in maintenance mode"),
    RESOURCE_CONFLICT(9006, "Resource conflict detected"),

    ;

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}