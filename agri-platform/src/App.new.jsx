import React, { useState, useEffect } from "react";
import { initializeDatabase } from "./utils/db";
import { loadCurrentUser, saveCurrentUser, loadSavedWeather, saveWeather, fetchWeatherByCoords } from "./utils/auth";
import { loadSavedWeather as loadSavedWeatherUtil, saveWeather as saveWeatherUtil } from "./utils/weather";
import { AuthScreen } from "./components/Auth/AuthScreen";
import { Shell } from "./components/Shell/Shell";
import { CustomerDashboard, CustomerMarket } from "./components/Customer/Customer";
import { SupplierDashboard, SupplierInventory, SupplierOrders, MarketPricesPage } from "./components/Supplier/Supplier";
import { TransportDashboard, TransportDeliveries, EarningsPage, RouteMapPage } from "./components/Transport/Transport";
import { CropsPage, WeatherPage, CommunityPage } from "./components/Shared/SharedComponents";

// Global database instance
const DB = initializeDatabase();

export default function App() {
  const [user, setUser] = useState(loadCurrentUser);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [weather, setWeather] = useState(() => loadSavedWeatherUtil() || DB.weather);
  const [weatherStatus, setWeatherStatus] = useState({ loading: false, error: null });

  useEffect(() => {
    if (user) {
      saveCurrentUser(user);
      setActiveTab("dashboard");
    }
  }, [user]);

  const handleLogin = (userData) => {
    saveCurrentUser(userData);
    setUser(userData);
  };

  const handleLogout = () => {
    saveCurrentUser(null);
    setUser(null);
  };

  useEffect(() => {
    if (!user || typeof navigator === "undefined" || !navigator.geolocation) return;

    const handleGeoSuccess = async (position) => {
      const { latitude, longitude } = position.coords;
      setWeatherStatus({ loading: true, error: null });
      const newWeather = await fetchWeatherByCoords(latitude, longitude);
      if (newWeather) {
        setWeather(newWeather);
        saveWeatherUtil(newWeather);
      } else {
        setWeatherStatus({ loading: false, error: "Unable to load real weather data." });
      }
      setWeatherStatus(prev => ({ ...prev, loading: false }));
    };

    const handleGeoError = (err) => {
      console.warn("Geolocation error:", err.message);
      setWeatherStatus({
        loading: false,
        error: "Location denied or unavailable. Using fallback weather."
      });
    };

    navigator.geolocation.getCurrentPosition(handleGeoSuccess, handleGeoError, { timeout: 15000 });
  }, [user]);

  if (!user) return <AuthScreen onLogin={handleLogin} DB={DB} />;

  const renderContent = () => {
    if (user.role === "customer") {
      if (activeTab === "dashboard") return <CustomerDashboard user={user} DB={DB} />;
      if (activeTab === "market") return <CustomerMarket user={user} DB={DB} />;
      if (activeTab === "crops") return <CropsPage DB={DB} />;
      if (activeTab === "weather") return <WeatherPage weather={weather} status={weatherStatus} DB={DB} />;
      if (activeTab === "community") return <CommunityPage user={user} DB={DB} />;
    }
    if (user.role === "supplier") {
      if (activeTab === "dashboard") return <SupplierDashboard user={user} DB={DB} />;
      if (activeTab === "inventory") return <SupplierInventory user={user} DB={DB} />;
      if (activeTab === "orders") return <SupplierOrders user={user} DB={DB} />;
      if (activeTab === "market") return <MarketPricesPage DB={DB} />;
      if (activeTab === "community") return <CommunityPage user={user} DB={DB} />;
    }
    if (user.role === "transport") {
      if (activeTab === "dashboard") return <TransportDashboard user={user} DB={DB} />;
      if (activeTab === "deliveries") return <TransportDeliveries user={user} DB={DB} />;
      if (activeTab === "map") return <RouteMapPage />;
      if (activeTab === "earnings") return <EarningsPage user={user} DB={DB} />;
      if (activeTab === "community") return <CommunityPage user={user} DB={DB} />;
    }
    return <div>Coming soon</div>;
  };

  return (
    <Shell user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} weather={weather} DB={DB}>
      {renderContent()}
    </Shell>
  );
}
