package com.appsmith.server.domains;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@EqualsAndHashCode
@Getter
@Setter
@NoArgsConstructor
public class UserInGroup {

    String id;

    String username;

    // Constructor to generate the object using User object.
    public UserInGroup(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
    }

}
