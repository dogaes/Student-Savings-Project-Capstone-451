package com.ninjapenguins.finance.common;

import org.springframework.http.HttpStatus;

public class FieldException extends RuntimeException {

    private final HttpStatus status;
    private final String field;

    public FieldException(HttpStatus status, String field, String message) {
        super(message);
        this.status = status;
        this.field = field;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getField() {
        return field;
    }
}