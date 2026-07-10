import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class TestBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        boolean match = encoder.matches("Password@123", "$2a$12$suDFoge3YdvkKOYkTg3sD.bTbQAevcLRzZw/NxRPl3g5lutDXUk4u");
        System.out.println("Match: " + match);
    }
}
