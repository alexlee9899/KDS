import { Stack } from "expo-router";
import { OrderProvider } from "../contexts/OrderContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { CategoryColorProvider } from "../contexts/CategoryColorContext";

export default function RootLayout() {
  return (
    <CategoryColorProvider>
      <LanguageProvider>
        <OrderProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </OrderProvider>
      </LanguageProvider>
    </CategoryColorProvider>
  );
}
