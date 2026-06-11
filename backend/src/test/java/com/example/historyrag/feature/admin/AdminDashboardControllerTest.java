package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

    @Mock
    private AdminDashboardService adminDashboardService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AdminDashboardController controller = new AdminDashboardController(adminDashboardService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("Should return dashboard response wrapper")
    void getDashboard_existingSummary_returnsDashboardResponse() throws Exception {
        when(adminDashboardService.getDashboard())
                .thenReturn(new DashboardResponse(
                        1L,
                        10L,
                        20L,
                        15L,
                        4L,
                        1L,
                        7L,
                        8L,
                        9L,
                        3L,
                        6L,
                        2L,
                        30L,
                        5L,
                        1L,
                        4L,
                        0L,
                        List.of()
                ));

        mockMvc.perform(get("/api/v1/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin dashboard thành công"))
                .andExpect(jsonPath("$.data.totalAdmins").value(1))
                .andExpect(jsonPath("$.data.totalMembers").value(10))
                .andExpect(jsonPath("$.data.totalPosts").value(20))
                .andExpect(jsonPath("$.data.pendingComments").value(1));
    }
}
