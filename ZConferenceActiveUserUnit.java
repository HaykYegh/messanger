package com.beint.project.core.wrapper.sdk;

/**
 * Keep information about active users in voice call
 */
public class ZConferenceActiveUserUnit {

    /**
     * User ID
     */
    private int userId;

    /**
     * User Name
     */
    private String userName;

    /**
     * The time mark when user started voice activity
     */
    private long startActivityTime;

    /**
     * The time mark when user last time had voice activity
     */
    private long lastActivityTime;


    /**
     * Create and initialize the instance
     */
    public ZConferenceActiveUserUnit(int userId, String userName, long startActivityTime, long lastActivityTime) {
        this.userId = userId;
        this.userName = userName;
        this.startActivityTime = startActivityTime;
        this.lastActivityTime = lastActivityTime;
    }

    /**
     * @return User ID
     */
    public int getUserId() {
        return userId;
    }

    /**
     * @return User name
     */
    public String getUserName() {
        return userName;
    }

    /**
     * @return The time mark when user started voice activity
     */
    public long getStartActivityTime() {
        return startActivityTime;
    }

    /**
     * @return The time mark when user last time had voice activity
     */
    public long getLastActivityTime() {
        return lastActivityTime;
    }

    /**
     * Set the time mark when user last time had voice activity
     */
    public void setLastActivityTime(long lastActivityTime) {
        this.lastActivityTime = lastActivityTime;
    }
}