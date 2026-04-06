package com.taivs.EcommerceWeb.mappers.user;

import com.taivs.EcommerceWeb.dto.request.user.UserCreationRequest;
import com.taivs.EcommerceWeb.dto.request.user.UserUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.models.user.User;
import org.mapstruct.*;
import com.taivs.EcommerceWeb.mappers.auth.RoleMapper;

@Mapper(
        componentModel = "spring",
        uses = { RoleMapper.class }
)
public interface UserMapper {

    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
