// status strings
export const UNKNOWN = 'Unknown';
export const NORMAL = 'Normal';
export const CAUTION = 'Caution';
export const ERROR = 'Error';
export const UNUSED = 'Unused';
export const SUSPEND = 'Suspend';
export const ONLINE = 'Online';
export const OFFLINE = 'Offline';
export const ONLINE_PENDING = 'Online Pending';
export const OFFLINE_PENDING = 'Offline Pending';
export const ONLINE_FAILURE = 'Online Failure';
export const OFFLINE_FAILURE = 'Offline Failure';

// response structures
export type APIResult = {
    code: number;
    message: string;
};

export type ClusterInfo = {
    name: string;
    status: string;
};

export type ClusterToratio = {
    toratio: number;
};

export type ServerInfo = {
    name: string;
    status: string;
};

export type ResourceInfo = {
    name: string;
    type: string;
    status: string;
    current: string;
    group: string;
};

export type GroupInfo = {
    name: string;
    status: string;
    current: string;
    resources: ResourceInfo[];
};

export type MonitorInfo = {
    name: string;
    type: string;
    status: string;
    servers: ServerInfo[];
};

type APIResponse = {
    result: APIResult;
};

export type ClusterStatus = {
    id: string;
    cluster?: ClusterInfo;
    servers?: ServerInfo[];
    groups?: GroupInfo[];
    resources?: ResourceInfo[];
    monitors?: MonitorInfo[];
};

/** Response of Fetch function */
export type FetchResponse<T> = {
    ok: boolean;
    status: number;
    data?: T;
    message?: string;
};

/**
 * Internal fetch function
 * @param method POST | GET | UPDATE | DELETE
 * @param url URL to fetch
 * @param headers dictionary for headers (optional)
 * @param body data (optional)
 * @returns response
 */
const _fetch = async (
    method: string,
    url: string,
    headers?: Record<string, string>,
    body?: Record<string, unknown> | Record<string, unknown>[],
): Promise<Response> => {
    const opts: RequestInit = {
        method,
        headers,
    };
    if (body) {
        opts.headers = {
            ...headers,
            'Content-Type': 'application/json',
        };
        opts.body = JSON.stringify(body);
    }
    return await fetch(url, opts);
};

/**
 * Utility for fetch function
 * @param T type of data in return value (default=void)
 * @param method POST | GET | UPDATE | DELETE
 * @param url URL to fetch
 * @param headers dictionary for headers (optional)
 * @param body data (optional)
 * @returns response
 */
export const Fetch = async <T = void>(
    method: string,
    url: string,
    headers?: Record<string, string>,
    body?: Record<string, unknown> | Record<string, unknown>[],
): Promise<FetchResponse<T>> => {
    return await _fetch(method, url, headers, body)
        .then(async (response) => {
            const { result, ...data } = (await response.json()) as T & APIResponse;
            if (response.ok) {
                return {
                    ok: true,
                    status: response.status,
                    data: <T>data,
                    message: result.message,
                };
            }
            console.error(`Fetch error response: ${response.status} (${response.statusText})`);
            return {
                ok: false,
                status: response.status,
                message: result.message,
            };
        })
        .catch((err) => {
            return {
                ok: false,
                status: 500,
                message: err.message,
            };
        });
};

/** Options structure for Client class */
export type ClientOptions = {
    /**
     *  URL for API server like as 'http://server1:29009'
     */
    clpserver: string;
    /** OS user */
    user: string;
    /** OS password */
    passwd: string;
};

/** Operation parameters */
export type ExecuteOperationParams = {
    cmd: string;
    name?: string;
    target?: string;
};

/**
 * RESTful API client class
 */
export class Client {
    private initHeaders: Record<string, string>;
    private clpserver: string;

    /**
     * Constructor
     * @param opts options for client
     */
    constructor(opts: ClientOptions) {
        const authorizationBasic = btoa(opts.user + ':' + opts.passwd);
        this.initHeaders = {
            Authorization: 'Basic ' + authorizationBasic,
        };
        this.clpserver = opts.clpserver;
    }

    /** Get the status of the cluster part */
    public async getCluster(): Promise<ClusterInfo> {
        const response = await Fetch<{ cluster: ClusterInfo }>(
            'GET',
            this.clpserver + '/api/v1/cluster',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.cluster;
    }

    /** Get toratio value */
    public async getToratio(): Promise<ClusterToratio> {
        const response = await Fetch<{ cluster: ClusterToratio }>(
            'GET',
            this.clpserver + '/api/v1/cluster/toratio',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.cluster;
    }

    /** Get the status of the cluster node part */
    public async getServers(name?: string): Promise<ServerInfo[]> {
        const uri = '/api/v1/servers' + (name == undefined ? '' : '/' + name);
        const response = await Fetch<{ servers: ServerInfo[] }>(
            'GET',
            this.clpserver + uri,
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.servers;
    }

    /** Enumerate names of the cluster node */
    public async getServerNames(): Promise<ServerInfo[]> {
        const response = await Fetch<{ servers: ServerInfo[] }>(
            'GET',
            this.clpserver + '/api/v1/servers?select=name',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.servers;
    }

    /** Get the status of the group part */
    public async getGroups(name?: string): Promise<GroupInfo[]> {
        const uri = '/api/v1/groups' + (name == undefined ? '' : '/' + name);
        const response = await Fetch<{ groups: GroupInfo[] }>(
            'GET',
            this.clpserver + uri,
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.groups;
    }

    /** Enumerate names of the group */
    public async getGroupNames(name?: string): Promise<GroupInfo[]> {
        const uri = '/api/v1/groups' + (name == undefined ? '' : '/' + name);
        const response = await Fetch<{ groups: GroupInfo[] }>(
            'GET',
            this.clpserver + uri + '?select=name',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.groups;
    }

    /** Enumerate names of the group resource */
    public async getGroupResources(name?: string): Promise<GroupInfo[]> {
        const uri = '/api/v1/groups' + (name == undefined ? '' : '/' + name);
        const response = await Fetch<{ groups: GroupInfo[] }>(
            'GET',
            this.clpserver + uri + '?select=resources',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.groups;
    }

    /** Get the status of the group resource part */
    public async getResources(name?: string): Promise<ResourceInfo[]> {
        const uri = '/api/v1/resources' + (name == undefined ? '' : '/' + name);
        const response = await Fetch<{ resources: ResourceInfo[] }>(
            'GET',
            this.clpserver + uri,
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.resources;
    }

    /** Enumerate names of the group resource */
    public async getResourceNames(): Promise<ResourceInfo[]> {
        const response = await Fetch<{ resources: ResourceInfo[] }>(
            'GET',
            this.clpserver + '/api/v1/resources?select=name',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.resources;
    }

    /** Get the status of the monitor resource part */
    public async getMonitors(name?: string): Promise<MonitorInfo[]> {
        const uri = '/api/v1/monitors' + (name == undefined ? '' : '/' + name);
        const response = await Fetch<{ monitors: MonitorInfo[] }>(
            'GET',
            this.clpserver + uri,
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.monitors;
    }

    /** Enumerate names of the monitor resource */
    public async getMonitorNames(): Promise<MonitorInfo[]> {
        const response = await Fetch<{ monitors: MonitorInfo[] }>(
            'GET',
            this.clpserver + '/api/v1/monitors?select=name',
            this.initHeaders,
        );
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        return response.data.monitors;
    }

    /**
     * Get the cluster status
     * ```
     * await client
     *   .getClusterStatus()
     *   .then((status) => {
     *     console.log(status);
     *   })
     *   .catch((err) => {
     *     console.error(err.message);
     *   });
     * ```
     * @returns Cluster status information
     */
    public async getClusterStatus(): Promise<ClusterStatus> {
        // Cluster status
        const clusterInfo = await this.getCluster();
        const serversInfo = await this.getServers();
        const groupsInfo = await this.getGroups();
        const resourcesInfo = await this.getResources();
        const monitorsInfo = await this.getMonitors();

        return {
            id: this.clpserver,
            cluster: clusterInfo,
            servers: serversInfo,
            groups: groupsInfo,
            resources: resourcesInfo,
            monitors: monitorsInfo,
        };
    }

    /**
     * Execute the cluster operation specified by the argument
     * @param uri URI part for configuring RESTful API endpoints
     * @param params command options
     * @returns none
     */
    private async commandPost(
        uri: string,
        params?: Record<string, unknown> | Record<string, unknown>[],
    ): Promise<void> {
        const response = await Fetch('POST', this.clpserver + uri, this.initHeaders, params);
        if (!response.ok || !response.data) {
            throw new Error(response.message);
        }
        if (response.message !== '') {
            // when operation command execution fails, message contains a cause.
            throw new Error(response.message);
        }
        return;
    }

    public async startCluster(): Promise<void> {
        await this.commandPost('/api/v1/cluster/start');
    }

    public async stopCluster(): Promise<void> {
        await this.commandPost('/api/v1/cluster/stop');
    }

    public async rebootCluster(): Promise<void> {
        await this.commandPost('/api/v1/cluster/reboot');
    }

    public async shutdownCluster(): Promise<void> {
        await this.commandPost('/api/v1/cluster/shutdown');
    }

    public async suspendCluster(): Promise<void> {
        await this.commandPost('/api/v1/cluster/suspend');
    }

    public async resumeCluster(): Promise<void> {
        await this.commandPost('/api/v1/cluster/resume');
    }

    public async setToratio(ratio: number, time: string): Promise<void> {
        await this.commandPost('/api/v1/cluster/toratio/set', {
            ratio,
            time,
        });
    }

    public async resetToratio(): Promise<void> {
        await this.commandPost('/api/v1/cluster/toratio/reset');
    }

    public async startServer(serverName: string): Promise<void> {
        await this.commandPost(`/api/v1/servers/${serverName}/start`);
    }

    public async stoptServer(serverName: string): Promise<void> {
        await this.commandPost(`/api/v1/servers/${serverName}/stop`);
    }

    public async rebootServer(serverName: string): Promise<void> {
        await this.commandPost(`/api/v1/servers/${serverName}/reboot`);
    }

    public async shutdownServer(serverName: string): Promise<void> {
        await this.commandPost(`/api/v1/servers/${serverName}/shutdown`);
    }

    public async startGroup(groupName?: string, target?: string): Promise<void> {
        const uri = '/api/v1/groups' + (groupName == undefined ? '' : '/' + groupName);
        const opts = target ? { target } : undefined;
        await this.commandPost(`${uri}/start`, opts);
    }

    public async stopGroup(groupName?: string, target?: string): Promise<void> {
        const uri = '/api/v1/groups' + (groupName == undefined ? '' : '/' + groupName);
        const opts = target ? { target } : undefined;
        await this.commandPost(`${uri}/stop`, opts);
    }

    public async moveGroup(groupName: string, target?: string): Promise<void> {
        const opts = target ? { target } : undefined;
        await this.commandPost(`/api/v1/groups/${groupName}/move`, opts);
    }

    public async startResource(resourceName: string, target: string): Promise<void> {
        await this.commandPost(`/api/v1/resources/${resourceName}/start`, { target });
    }

    public async stopResource(resourceName: string): Promise<void> {
        await this.commandPost(`/api/v1/resources/${resourceName}/stop`);
    }

    public async resumeMonitor(monitorName: string, target: string): Promise<void> {
        await this.commandPost(`/api/v1/monitors/${monitorName}/resume`, { target });
    }

    public async suspendMonitor(monitorName: string, target: string): Promise<void> {
        await this.commandPost(`/api/v1/monitors/${monitorName}/suspend`, { target });
    }

    public async runScript(
        script: string,
        target: string,
        timeout: number,
        logdir: string,
    ): Promise<void> {
        await this.commandPost(`/api/v1/scripts/run`, { script, target, timeout, logdir });
    }

    /**
     * Execute specified action to cluster
     * ```
     * await client
     *   .execOperation({
     *     cmd: 'moveGroup',
     *     name: 'failover1'
     *   })
     *   .catch((err) => {
     *     console.error(err.message);
     *   });
     * ```
     * @param params operation parameters
     * @returns none
     */
    public async execOperation(params: ExecuteOperationParams) {
        const { cmd, name, target } = params;
        // console.log(`Operation: [${this.clpserver}] ${cmd} name=${name} target=${target}`);
        const operation: Record<string, () => void> = {
            startCluster: async () => {
                await this.startCluster();
            },
            stopCluster: async () => {
                await this.stopCluster();
            },
            rebootCluster: async () => {
                await this.rebootCluster();
            },
            shutdownCluster: async () => {
                await this.shutdownCluster();
            },
            suspendCluster: async () => {
                await this.suspendCluster();
            },
            resumeCluster: async () => {
                await this.resumeCluster();
            },

            startServer: async () => {
                await this.startServer(name!);
            },
            stopServer: async () => {
                await this.stoptServer(name!);
            },
            rebootServer: async () => {
                await this.rebootServer(name!);
            },
            shutdownServer: async () => {
                await this.shutdownServer(name!);
            },

            startGroup: async () => {
                await this.startGroup(name!, target!);
            },
            stopGroup: async () => {
                await this.stopGroup(name!, target!);
            },
            moveGroup: async () => {
                await this.moveGroup(name!, target!);
            },

            startResource: async () => {
                await this.startResource(name!, target!);
            },
            stopResource: async () => {
                await this.stopResource(name!);
            },

            suspendMonitor: async () => {
                await this.suspendMonitor(name!, target!);
            },
            resumeMonitor: async () => {
                await this.resumeMonitor(name!, target!);
            },
        };

        if (cmd in operation) {
            return operation[cmd]();
        }

        throw new Error(`Invalid operation (${params.cmd})`);
    }
}
