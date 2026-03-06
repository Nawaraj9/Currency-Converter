import java.util.Scanner;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class CurrencyConverter {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.println("=== Currency Converter (Live Rates) ===");
        System.out.print("Enter source currency (e.g. USD): ");
        String from = scanner.next().toUpperCase();

        System.out.print("Enter target currency (e.g. EUR): ");
        String to = scanner.next().toUpperCase();

        System.out.print("Enter amount: ");
        double amount = scanner.nextDouble();

        try {
            double rate = getExchangeRate(from, to);
            double result = amount * rate;
            System.out.printf("%.2f %s = %.2f %s  (rate: %.4f)%n", amount, from, result, to, rate);
        } catch (Exception e) {
            System.out.println("Error fetching exchange rate: " + e.getMessage());
        }

        scanner.close();
    }

    static double getExchangeRate(String from, String to) throws Exception {
        // API 
        String urlStr = "https://api.exchangerate-api.com/v4/latest/" + from;

        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);

        int status = conn.getResponseCode();
        if (status != 200) {
            throw new Exception("HTTP error " + status + ". Check your currency code: " + from);
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();

        // Response
        String json = response.toString();
        String searchKey = "\"" + to + "\":";
        int keyIndex = json.indexOf(searchKey);
        if (keyIndex == -1) {
            throw new Exception("Unsupported target currency: " + to);
        }
        int valueStart = keyIndex + searchKey.length();
        int valueEnd = json.indexOf(",", valueStart);
        if (valueEnd == -1) valueEnd = json.indexOf("}", valueStart);
        String rateStr = json.substring(valueStart, valueEnd).trim();

        return Double.parseDouble(rateStr);
    }
}
