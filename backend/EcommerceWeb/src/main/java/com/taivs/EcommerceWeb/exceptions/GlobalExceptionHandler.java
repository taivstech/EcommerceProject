package com.taivs.EcommerceWeb.exceptions;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Objects;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(Exception exception) {
        log.error("Unhandled exception: ", exception);
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

        return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    ResponseEntity<ApiResponse> handlingHttpMessageNotReadable(HttpMessageNotReadableException exception) {
        log.warn("Malformed request body: {}", exception.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.builder()
                        .code(ErrorCode.INVALID_REQUEST.getCode())
                        .message("Malformed request body")
                        .build());
    }

    @ExceptionHandler(value = MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiResponse> handlingTypeMismatch(MethodArgumentTypeMismatchException exception) {
        String message = String.format("Parameter '%s' must be of type %s",
                exception.getName(),
                exception.getRequiredType() != null ? exception.getRequiredType().getSimpleName() : "unknown");
        log.warn("Type mismatch: {}", message);
        return ResponseEntity.badRequest()
                .body(ApiResponse.builder()
                        .code(ErrorCode.INVALID_REQUEST.getCode())
                        .message(message)
                        .build());
    }

    @ExceptionHandler(value = MissingServletRequestParameterException.class)
    ResponseEntity<ApiResponse> handlingMissingParam(MissingServletRequestParameterException exception) {
        String message = String.format("Required parameter '%s' is missing", exception.getParameterName());
        log.warn("Missing parameter: {}", message);
        return ResponseEntity.badRequest()
                .body(ApiResponse.builder()
                        .code(ErrorCode.INVALID_REQUEST.getCode())
                        .message(message)
                        .build());
    }

    @ExceptionHandler(value = MaxUploadSizeExceededException.class)
    ResponseEntity<ApiResponse> handlingMaxUploadSize(MaxUploadSizeExceededException exception) {
        log.warn("Upload too large: {}", exception.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.builder()
                        .code(ErrorCode.INVALID_REQUEST.getCode())
                        .message("File size exceeds the maximum allowed limit")
                        .build());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        var fieldError = Objects.requireNonNull(exception.getFieldError());
        String fieldName = fieldError.getField();
        String defaultMessage = fieldError.getDefaultMessage();
        
        log.warn("Validation failed for field '{}': {}", fieldName, defaultMessage);

        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        String errorMessage = "Invalid request";

        try {
            errorCode = ErrorCode.valueOf(defaultMessage);
            errorMessage = errorCode.getMessage();
        } catch (IllegalArgumentException e) {
            errorMessage = String.format("Validation failed for '%s': %s", fieldName, defaultMessage);
            log.debug("Validation message is not an ErrorCode, using custom message: {}", errorMessage);
        }

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorMessage);

        return ResponseEntity.badRequest().body(apiResponse);
    }
}
