package com.example.historyrag.feature.admin.dto;

import java.util.List;

public record DashboardResponse(
        long totalAdmins,
        long totalMembers,
        long totalPosts,
        long publishedPosts,
        long draftPosts,
        long archivedPosts,
        long totalEvents,
        long totalPersons,
        long totalLocations,
        long totalSources,
        long totalTags,
        long totalPeriods,
        long totalEngagements,
        long totalComments,
        long pendingComments,
        long visibleComments,
        long hiddenComments,
        List<DashboardActivityResponse> activities
) {
}
