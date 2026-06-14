package com.nortear.auth.service;

import com.nortear.auth.dto.AuthResponse;
import com.nortear.auth.dto.LoginRequest;
import com.nortear.auth.dto.RegisterRequest;
import com.nortear.auth.dto.UserResponse;
import com.nortear.auth.mapper.UserMapper;
import com.nortear.auth.messaging.UserCreatedEvent;
import com.nortear.auth.messaging.UserRegistrationProducer;
import com.nortear.auth.model.goal.Goal;
import com.nortear.auth.model.skill.Skill;
import com.nortear.auth.model.user.User;
import com.nortear.auth.model.user.UserStatus;
import com.nortear.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final UserRegistrationProducer userRegistrationProducer;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .status(UserStatus.PENDING_CONFIRMATION)
                .skillList(new HashSet<>())
                .goalList(new HashSet<>())
                .build();

        User saved = userRepository.save(user);

        if (request.skillsAtuais() != null) {
            request.skillsAtuais().stream()
                    .filter(s -> !s.isBlank())
                    .map(name -> Skill.builder().name(name).user(saved).build())
                    .forEach(saved.getSkillList()::add);
        }

        Goal goal = Goal.builder().name(request.vagaDesejada()).user(saved).build();
        saved.getGoalList().add(goal);

        UserResponse response = userMapper.toResponse(userRepository.save(saved));

        // Saga: dispara evento para chat-service inicializar o perfil no MCP/embedding
        List<String> skillNames = saved.getSkillList().stream().map(Skill::getName).toList();
        String vagaDesejada = saved.getGoalList().stream()
                .findFirst().map(Goal::getName).orElse("");
        userRegistrationProducer.publishUserCreated(new UserCreatedEvent(saved.getId(), vagaDesejada, skillNames));

        return response;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email()).orElseThrow();
        return new AuthResponse(jwtService.generateToken(user), userMapper.toResponse(user));
    }
}
