package com.beint.project.core.wrapper.sdk;

import java.util.HashMap;
import java.util.Map;

/**
 * Encapsulate call/conferencing participant data and functionality.
 *
 * @author Vahram Martirosyan
 */
public class ZConferenceParticipant {

    /**
     * Conference participant ID.
     * This ID is automated generating by system.
     */
    private final int participantId;

    /**
     * Conference participant user name.
     * Can be maximum 30 symbols.
     * The value specified by Zangi SDK developer.
     */
    private final String name;

    /**
     * Map for user defined properties.
     *
     * Key - user property ID. 1 byte integer, valid values are 0-255.
     * Value - user property value
     */
    private final Map<Integer, String> properties;

    /**
     * Create and initialize the instance.
     */
    public ZConferenceParticipant(int participantId, String name, HashMap<Integer, String> properties) {
        this.participantId = participantId;
        this.name = name;
        this.properties = properties;
    }

    /**
     * Create and initialize the instance.
     */
    public ZConferenceParticipant(int participantId, String name) {
        this.participantId = participantId;
        this.name = name;
        this.properties = new HashMap<>();
    }

    /**
     * Conference participant ID.
     */
    public int getId() {
        return participantId;
    }

    /**
     * Conference participant name.
     */
    public String getName() {
        return name;
    }

    /**
     * Set/change user defined property into conference participant properties map
     */
    public void setProperty(int propertyId, String value) {
        synchronized (properties) {
            properties.put(propertyId, value);
        }
    }

    /**
     * @return Corresponding property value by given key
     */
    public String getProperty(int propertyId) {
        synchronized (properties) {
            return properties.get(propertyId);
        }
    }

    /**
     * @return All properties of current participant
     */
    public Map<Integer, String> getAll() {
        synchronized (properties) {
            return new HashMap<>(properties);
        }
    }

}