// eslint-disable-next-line max-classes-per-file
import ServiceFactory from '../../src/api/ServiceFactory';
import Service from '../../src/api/Service';
import Context from '../../src/api/Context';

export const SERVICE_ID_A = 'service_a';

export class ServiceA implements Service {

    public readonly id = SERVICE_ID_A;

    public readonly initPriority = 100;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public config: any;

    public init(context: Context): void {
        this.config = context.serviceConfigs.get(this.id);
    }
}

export default class ServiceFactoryA implements ServiceFactory {

    public readonly serviceA = new ServiceA();

    public getServices(): Iterable<Service> {
        return [this.serviceA];
    }
}
