package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.entity.User;

public interface OtpService {

    void generateAndSend(User user);

    void verify(User user, String code);
}