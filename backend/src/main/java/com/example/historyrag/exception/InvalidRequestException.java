package com.example.historyrag.exception;

import org.springframework.http.HttpStatus;

public class InvalidRequestException extends AppException {

    public InvalidRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
