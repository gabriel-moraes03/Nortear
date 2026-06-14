package com.nortear.auth.mapper;

public interface BaseMapper<E, RQ, RS> {
    E toEntity(RQ request);
    RS toResponse(E entity);
    void copyProperties(RQ request, E entity);
}
