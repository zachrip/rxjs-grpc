import * as grpc from 'grpc';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import { lookupPackage } from './utils';

type DynamicMethods = { [name: string]: any; };

export interface GenericServerBuilder<T> {
  start(address: string, credentials?: any): void;
  forceShutdown(): void;
}

export function serverBuilder<T>(protoPath: string, packageName: string): T & GenericServerBuilder<T> {
  const server = new grpc.Server();

  const builder: DynamicMethods = <GenericServerBuilder<T>> {
    start(address: string, credentials?: any) {
      server.bind(address, credentials || grpc.ServerCredentials.createInsecure());
      server.start();
    },
    forceShutdown() {
      server.forceShutdown();
    }
  };

  const pkg = lookupPackage(grpc.load(protoPath), packageName)
  for (const name of getServiceNames(pkg)) {
    builder[`add${name}`] = function(rxImpl: DynamicMethods) {
      server.addProtoService(pkg[name].service, createService(pkg[name], rxImpl));
      return this;
    };
  }

  return builder as any;
}

function createService(Service: any, rxImpl: DynamicMethods) {
  const service: DynamicMethods = {};
  for (const name in Service.prototype) {
    if (typeof rxImpl[name] === 'function') {
      service[name] = createMethod(rxImpl, name, Service.prototype);
    }
  }
  return service;
}

function createMethod(rxImpl: DynamicMethods, name: string, serviceMethods: DynamicMethods) {
  return async function (call: any, callback: any) {
    const serviceMethod = serviceMethods[name];

    let observable = Observable.of(call.request);
    if (serviceMethod.requestStream) {
      observable = new Observable((observer) => {
        call.on('data', (data: any) => {
          observer.next(data);
        });

        call.on('cancel', () => {
          observer.error();
        });

        call.on('end', () => {
          observer.complete();
        });
      });
    }

    const response: Observable<any> = rxImpl[name](observable, call.metadata);
    
    if (serviceMethod.responseStream) {
      await response.forEach(data => call.write(data));
      call.end();
    } else {
      response.subscribe(
        data => callback(null, data),
        error => callback(error)
      );
    }
  }
}

export type ClientFactoryConstructor<T> = new(address: string, credentials?: any, options?: any) => T;

export function clientFactory<T>(protoPath: string, packageName: string) {
  class Constructor {

    readonly __args: any[];
    constructor(address: string, credentials?: any, options: any = undefined) {
      this.__args = [
        address,
        credentials || grpc.credentials.createInsecure(),
        options
      ];
    }

  }

  const prototype: DynamicMethods = Constructor.prototype;
  const pkg = lookupPackage(grpc.load(protoPath), packageName)
  for (const name of getServiceNames(pkg)) {
    prototype[`get${name}`] = function(this: Constructor) {
      return createServiceClient(pkg[name], this.__args);
    };
  }

  return <any> Constructor as ClientFactoryConstructor<T>;
}

function getServiceNames(pkg: any) {
  return Object.keys(pkg).filter(name => pkg[name].service);
}

function createServiceClient(GrpcClient: any, args: any[]) {
  const grpcClient = new GrpcClient(...args);
  const rxClient: DynamicMethods = {};
  for (const name of Object.keys(GrpcClient.prototype)) {
    rxClient[name] = createClientMethod(grpcClient, name);
  }
  return rxClient;
}

interface ClientMethod extends Function {
  requestStream: boolean;
  responseStream: boolean;
}

function createClientMethod(grpcClient: DynamicMethods, name: string) {
  return function(...args: any[]) {
    const clientMethod = grpcClient[name] as ClientMethod;
    
    return new Observable(observer => {
      const handler = (error: any, data: any) => {
        if (error) {
          observer.error(error);
        } else {
          observer.next(data);
        }
        observer.complete();
      };

      let call: any;
      const actualHandler = clientMethod.responseStream ? undefined : handler;
      if (clientMethod.requestStream) {
        call = clientMethod.call(grpcClient, actualHandler);
      } else {
        call = clientMethod.apply(grpcClient, [...args, actualHandler]);
      }

      if (clientMethod.responseStream) {
        call.on('data', (data: any) => observer.next(data));
        call.on('error', (error: any) => observer.error(error));
        call.on('end', () => observer.complete());
      }
        
      if (clientMethod.requestStream) {
        const observable: Observable<any> = args[0];

        observable.subscribe((value) => {
          call.write(value);
        }, (error) => {
          call.cancel();
        }, () => {
          call.end();
        });
      }
    });
  }
}
