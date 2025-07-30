import { useState, useEffect } from "react";
import axios from "axios"; // Import axios

export const useMetalPrices = () => {
  const [prices, setPrices] = useState<{
    gold: { buy: String, sell: String, comex: string; inr: string; change: string; isUp: boolean; high: string; low: string; open: string; close: string } | null;

    spotGold: { spot: string; inr: string; change: string; isUp: boolean; high: string; low: string; open: string; close: string } | null;

    silver: { buy: String, sell: String, comex: string; inr: string; change: string; isUp: boolean; high: string; low: string; open: string; close: string } | null;
    lastUpdated: string | null;

    spotSilver: { comex: string; inr: string; change: string; isUp: boolean; high: string; low: string; open: string; close: string } | null;

    usdinr: { comex: string; inr: string; change: string; isUp: boolean; high: string; low: string; open: string; close: string } | null;
  }>
    ({
      gold: { buy: "Loading...", sell: "Loading...", comex: "Loading...", inr: "Loading...", change: "0", isUp: false, high: "Loading...", low: "Loading...", open: "Loading...", close: "Loading..." },

      spotGold: { spot: "Loading...", inr: "Loading...", change: "0", isUp: false, high: "Loading...", low: "Loading...", open: "Loading...", close: "Loading..." },

      silver: { buy: "Loading...", sell: "Loading...", comex: "Loading...", inr: "Loading...", change: "0", isUp: false, high: "Loading...", low: "Loading...", open: "Loading...", close: "Loading..." },

      spotSilver: { comex: "Loading...", inr: "Loading...", change: "0", isUp: false, high: "Loading...", low: "Loading...", open: "Loading...", close: "Loading..." },

      usdinr: { comex: "Loading...", inr: "Loading...", change: "0", isUp: false, high: "Loading...", low: "Loading...", open: "Loading...", close: "Loading..." },
      lastUpdated: null,
    });
  const [loading, setLoading] = useState(false);

  // Function to fetch updated prices from the API
  const refreshPrices = async () => {
    setLoading(true);

    try {
      // Fetch data from the API
      const response = await axios.get("https://liveapi.uk/com/vs/");
      const data: { symb: string; rate: string; chg: string; high: string; low: string; open: string; close: string; buy?: string; sell?: string }[] = response.data;

      // Extract data for GOLD and SILVER
      const goldData = data.find((item) => item.symb === "GOLD");
      const usdinr = data.find((item) => item.symb === "USDINR");
      const SpotGoldData = data.find((item) => item.symb === "SPOTGold");
      const silverData = data.find((item) => item.symb === "SILVER");
      const spotSilverData = data.find((item) => item.symb === "SPOTSilver");

      // Update state with fetched data
      setPrices({
        usdinr: {
          comex: usdinr?.rate || "Loading...",
          inr: usdinr?.buy || "Loading...", // Add INR property
          change: usdinr?.chg || "0",
          isUp: usdinr ? Number(usdinr.chg) > 0 : false,
          high: usdinr?.high || "Loading...", // Add high property
          low: usdinr?.low || "Loading...", // Add low property
          open: usdinr?.open || "Loading...", // Add open price
          close: usdinr?.close || "Loading...", // Add open price
        },
        gold: {
          buy: goldData?.buy || "Loading...",
          sell: goldData?.sell || "Loading...",
          comex: goldData?.buy || "Loading...",
          inr: goldData?.buy || "Loading...", // Add INR property
          change: goldData?.chg || "0",
          isUp: goldData ? Number(goldData.chg) > 0 : false,
          high: goldData?.high || "Loading...", // Add high property
          low: goldData?.low || "Loading...", // Add low property
          open: goldData?.open || "Loading...", // Add open price
          close: goldData?.close || "Loading...", // Add open price
        },
        spotGold: {
          spot: SpotGoldData?.buy || "Loading...",
          inr: SpotGoldData?.buy || "Loading...", // Add INR property
          change: SpotGoldData?.chg || "0",
          isUp: SpotGoldData ? Number(SpotGoldData.chg) > 0 : false,
          high: SpotGoldData?.high || "Loading...", // Add high property
          low: SpotGoldData?.low || "Loading...", // Add low property
          open: SpotGoldData?.open || "Loading...", // Add open price
          close: SpotGoldData?.close || "Loading...", // Add open price
        },
        silver: {
          buy: silverData?.buy || "Loading...",
          sell: silverData?.sell || "Loading...",
          comex: silverData?.buy || "Loading...",
          inr: silverData?.buy || "Loading...", // Add INR property
          change: silverData?.chg || "0",
          isUp: silverData ? Number(silverData.chg) > 0 : false,
          high: silverData?.high || "Loading...", // Add high property
          low: silverData?.low || "Loading...", // Add low property
          open: silverData?.open || "Loading...", // Add open price
          close: silverData?.close || "Loading...", // Add open price
        },
        spotSilver: {
          comex: spotSilverData?.buy || "Loading...",
          inr: spotSilverData?.buy || "Loading...", // Add INR property
          change: spotSilverData?.chg || "0",
          isUp: spotSilverData ? Number(spotSilverData.chg) > 0 : false,
          high: spotSilverData?.high || "Loading...", // Add high property
          low: spotSilverData?.low || "Loading...", // Add low property
          open: spotSilverData?.open || "Loading...", // Add open price
          close: spotSilverData?.close || "Loading...", // Add open price
        },
        lastUpdated: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
      });
    } catch (error) {
      // console.error("Error fetching metal prices:", error);
    } finally {
      setLoading(false);
    }
  };

  // update every 1 second
  useEffect(() => {
    const interval = setInterval(refreshPrices, 1000);
    refreshPrices();

    return () => clearInterval(interval);
  }, [Error]);

  return { prices, loading, refreshPrices, Error };
};