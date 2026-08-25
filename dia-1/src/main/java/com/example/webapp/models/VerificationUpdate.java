package com.example.webapp.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class VerificationUpdate {
    private Integer verificationStatus;

    public VerificationUpdate() {}

    @JsonCreator
    public VerificationUpdate(@JsonProperty("verificationStatus") Integer verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Integer getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(Integer verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    // Compatibility method to match existing record-style calls: body.verificationStatus()
    public Integer verificationStatus() {
        return this.verificationStatus;
    }
}
