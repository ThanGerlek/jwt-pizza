import React from "react";
import { useLocation } from "react-router-dom";
import { useBreadcrumb } from "../hooks/appNavigation";
import { pizzaService } from "../service/service";
import View from "./view";
import Button from "../components/button";
import { franchiseCloseErrorMessage } from "../utils/apiErrorMessage";

export default function CloseStore() {
  const state = useLocation().state;
  const navigateToParent = useBreadcrumb();
  const [errMessage, setErrMessage] = React.useState("");

  async function close() {
    try {
      await pizzaService.closeStore(state.franchise, state.store);
      navigateToParent();
    } catch (e: unknown) {
      setErrMessage(franchiseCloseErrorMessage(e));
    }
  }

  return (
    <View title="Sorry to see you go">
      <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
        {errMessage ? (
          <div
            className="text-orange-700 bg-yellow-100 p-2 rounded-md mb-4"
            role="alert"
          >
            {errMessage}
          </div>
        ) : null}
        <div className="text-neutral-100">
          Are you sure you want to close the{" "}
          <span className="text-orange-500">{state.franchise.name}</span> store{" "}
          <span className="text-orange-500">{state.store.name}</span> ? This
          cannot be restored. All outstanding revenue will not be refunded.
        </div>
        <Button title="Close" onPress={close} />
        <Button
          title="Cancel"
          onPress={navigateToParent}
          className="bg-transparent border-neutral-300"
        />
      </div>
    </View>
  );
}
