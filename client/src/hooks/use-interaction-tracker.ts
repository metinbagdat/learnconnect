import { useEffect, useRef } from "react";

interface ApiInteraction {
  type: "api_call";
  timestamp: number;
  url: string;
  method: string;
  duration: number;
  status: number;
  module: string;
  userId?: number;
}

interface UserInteraction {
  type: "user_click" | "user_input" | "user_scroll";
  timestamp: number;
  element?: string;
  classes?: string;
  text?: string;
  module: string;
  userId?: number;
}

type Interaction = ApiInteraction | UserInteraction;

interface ModuleFlowData {
  interactions: Interaction[];
  apiCalls: number;
  userActions: number;
  averageResponseTime: number;
}

export function useInteractionTracker() {
  const interactionsRef = useRef<Interaction[]>([]);
  const flowMapRef = useRef<Map<string, ModuleFlowData>>(new Map());

  const extractModuleFromUrl = (url: string): string => {
    if (url.includes("/course-control")) return "course_management";
    if (url.includes("/content")) return "content_delivery";
    if (url.includes("/progress")) return "progress_tracking";
    if (url.includes("/engagement")) return "user_engagement";
    if (url.includes("/analytics")) return "analytics_engine";
    return "unknown";
  };

  const determineModuleFromElement = (element: HTMLElement): string => {
    const classes = element.className;
    if (classes.includes("course")) return "course_management";
    if (classes.includes("content")) return "content_delivery";
    if (classes.includes("progress")) return "progress_tracking";
    if (classes.includes("engagement")) return "user_engagement";
    if (classes.includes("analytics")) return "analytics_engine";
    return "unknown";
  };

  const trackApiCall = (url: string, method: string, status: number, duration: number) => {
    const interaction: ApiInteraction = {
      type: "api_call",
      timestamp: Date.now(),
      url,
      method,
      duration,
      status,
      module: extractModuleFromUrl(url),
    };

    interactionsRef.current.push(interaction);
    updateFlowMap(interaction);
  };

  const trackUserClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-track-interaction]")) {
      const interaction: UserInteraction = {
        type: "user_click",
        timestamp: Date.now(),
        element: target.tagName,
        classes: target.className,
        text: target.textContent?.substring(0, 50),
        module: determineModuleFromElement(target),
      };

      interactionsRef.current.push(interaction);
      updateFlowMap(interaction);
    }
  };

  const trackUserInput = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-track-interaction]")) {
      const interaction: UserInteraction = {
        type: "user_input",
        timestamp: Date.now(),
        element: target.tagName,
        module: determineModuleFromElement(target),
      };

      interactionsRef.current.push(interaction);
      updateFlowMap(interaction);
    }
  };

  const trackUserScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-track-interaction]")) {
      const interaction: UserInteraction = {
        type: "user_scroll",
        timestamp: Date.now(),
        module: determineModuleFromElement(target),
      };

      interactionsRef.current.push(interaction);
      updateFlowMap(interaction);
    }
  };

  const updateFlowMap = (interaction: Interaction) => {
    const module = interaction.module;
    if (!flowMapRef.current.has(module)) {
      flowMapRef.current.set(module, {
        interactions: [],
        apiCalls: 0,
        userActions: 0,
        averageResponseTime: 0,
      });
    }

    const moduleData = flowMapRef.current.get(module)!;
    moduleData.interactions.push(interaction);

    if (interaction.type === "api_call") {
      const apiCall = interaction as ApiInteraction;
      moduleData.apiCalls++;
      moduleData.averageResponseTime =
        (moduleData.averageResponseTime * (moduleData.apiCalls - 1) + apiCall.duration) /
        moduleData.apiCalls;
    } else {
      moduleData.userActions++;
    }

    flowMapRef.current.set(module, moduleData);
  };

  const getFlowMap = () => {
    const result: Record<string, ModuleFlowData> = {};
    flowMapRef.current.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  };

  const getRecentInteractions = (limit: number = 50) => {
    return interactionsRef.current.slice(-limit);
  };

  const clearInteractions = () => {
    interactionsRef.current = [];
    flowMapRef.current.clear();
  };

  useEffect(() => {
    // Override fetch to track API calls
    const originalFetch = window.fetch;
    (window as any).fetch = async (...args: any[]) => {
      const startTime = performance.now();
      const url = typeof args[0] === "string" ? args[0] : args[0].url;
      const method = args[1]?.method || "GET";

      try {
        const response = await originalFetch(args[0] as RequestInfo | URL, args[1] as RequestInit | undefined);
        const endTime = performance.now();
        trackApiCall(url, method, response.status, endTime - startTime);
        return response;
      } catch (error) {
        const endTime = performance.now();
        trackApiCall(url, method, 0, endTime - startTime);
        throw error;
      }
    };

    // Track DOM interactions
    document.addEventListener("click", trackUserClick);
    document.addEventListener("input", trackUserInput);
    document.addEventListener("scroll", trackUserScroll);

    return () => {
      document.removeEventListener("click", trackUserClick);
      document.removeEventListener("input", trackUserInput);
      document.removeEventListener("scroll", trackUserScroll);
    };
  }, []);

  return {
    getFlowMap,
    getRecentInteractions,
    clearInteractions,
    interactions: interactionsRef.current,
  };
}
