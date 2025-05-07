package com.fitness_centre.constant;

import java.time.LocalDateTime;

public enum Provider {

    GOOGLE("Google"),

    LOCAL("Local");
    public final String provider;

    Provider(String provider){
        this.provider = provider;
    }

    public String getProvider(){
        return this.provider;
    }
}