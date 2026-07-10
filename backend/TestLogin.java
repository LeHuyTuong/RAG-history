import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.userdetails.UserDetailsService;
import com.example.historyrag.HistoryRagApplication;

public class TestLogin {
    public static void main(String[] args) {
        ApplicationContext ctx = SpringApplication.run(HistoryRagApplication.class, args);
        UserDetailsService userDetailsService = ctx.getBean("customUserDetailsService", UserDetailsService.class);
        try {
            System.out.println("USER DETAILS: " + userDetailsService.loadUserByUsername("admin01@historyrag.local"));
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.exit(0);
    }
}
