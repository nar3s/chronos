import { NativeModule, requireNativeModule } from 'expo';

import { MyModuleEvents } from './MyModule.types';

declare class MyModule extends NativeModule<MyModuleEvents> {
  setDailyLogPending(isPending: boolean): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MyModule>('MyModule');
