package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.UserRequest;
import com.tunisietelecom.gestionstock.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRequest request);

    List<UserResponse> getAllUsers();

    void deleteUser(Long id);
}