import { NativeModules } from "react-native";

class OrderModule {
  OrderModule: any;
  onOrderReceived: ((order: any) => void) | null = null; // 添加回调处理器

  constructor() {
    this.OrderModule = NativeModules.OrderHandlerModule;
  }

  public async testCall() {
    this.OrderModule.TestAdd();
  }

  public async Bind() {
    this.OrderModule.BindCallback(this.callbackFunc);
  }

  public callbackFunc = (data: any) => {
    console.log("order callback --> " + data);

    if (data === "test call added") {
      console.log("测试调用成功");
      return;
    }

    if (typeof data === "string") {
      try {
        const orderData = JSON.parse(data);
        // 调用回调处理器
        if (this.onOrderReceived) {
          this.onOrderReceived(orderData);
        }
      } catch (error) {
        console.error("Failed to parse JSON:", error);
      }
    }
  };

  public setOrderCallback(callback: (order: any) => void) {
    this.onOrderReceived = callback;
  }
}

const orderModule = new OrderModule();
export default orderModule;
