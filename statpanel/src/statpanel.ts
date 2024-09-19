import ioClient from 'socket.io-client';
import type { ClusterStatus, ExecuteOperationParams } from './clusterapi.js';

export type { ClusterStatus };

// mapping status to class name
const statusMap: Record<string, string> = {
    Normal: 'gui-normal',
    Error: 'gui-error',
    Caution: 'gui-warning',
    Online: 'gui-online',
    Offline: 'gui-offline',
    'Online Pending': 'gui-online-pending',
    'Offline Pending': 'gui-offline-pending',
    'Online Failure': 'gui-online-failure',
    'Offline Failure': 'gui-offline-failure',
};

/**
 * Create a new button element
 * @private
 * @param id button id in cluster.svg
 * @param handler callback on click
 * @param disabled disable button when true
 * @param title display title on tooltip
 * @returns element
 */
function createButtonElement(
    id: string,
    handler: () => void,
    disabled?: boolean,
    title?: string,
): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gui-btn';
    btn.disabled = disabled ?? false;
    if (title) btn.title = title;
    btn.innerHTML = `<svg viewBox="0 0 128 128" class="gui-btn-icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="./lib/cluster.svg#${id}"></use></svg>`;
    btn.addEventListener('click', handler);
    return btn;
}

/**
 * Convert status to class name
 * @param status status string
 * @returns class name corresponding to css
 */
function status2Class(status: string): string {
    return statusMap[status] ?? 'unknown';
}

/** Sample GUI client class */
export class StatPanel {
    socket;

    constructor(clpserver: string) {
        this.socket = ioClient(clpserver);
    }

    getSocket() {
        return this.socket;
    }

    execOperation(id: string, params: ExecuteOperationParams) {
        this.socket.emit('execute', id, params);
    }

    showClusterStatus(element: HTMLElement, status: ClusterStatus) {
        element.innerHTML = '';
        // $viewarea.innerText = JSON.stringify(message, null, '\t');
        const divCard = document.createElement('div');

        // Cluster
        const divCl = document.createElement('div');
        divCl.innerText = `Cluster: ${status!.cluster!.name} `;
        divCl.className = 'gui-cluster';
        divCl.appendChild(
            createButtonElement(
                'power',
                () => {
                    this.execOperation(status.id, { cmd: 'shutdownCluster' });
                },
                false,
                'Shutdown',
            ),
        );
        divCl.appendChild(
            createButtonElement(
                'reboot',
                () => {
                    this.execOperation(status.id, { cmd: 'rebootCluster' });
                },
                false,
                'Reboot',
            ),
        );
        divCl.appendChild(
            createButtonElement(
                'start',
                () => {
                    this.execOperation(status.id, { cmd: 'startCluster' });
                },
                false,
                'Start Cluster',
            ),
        );
        divCl.appendChild(
            createButtonElement(
                'stop',
                () => {
                    this.execOperation(status.id, { cmd: 'stopCluster' });
                },
                false,
                'Stop Cluster',
            ),
        );
        divCard.appendChild(divCl);

        // Servers
        const divSvs = document.createElement('div');
        divCard.appendChild(divSvs);

        const divSvsH = document.createElement('div');
        divSvsH.innerText = 'Servers';
        divSvsH.className = 'gui-header';
        divSvs.appendChild(divSvsH);

        const divSvsB = document.createElement('div');
        divSvsB.className = 'gui-body';
        divSvs.appendChild(divSvsB);

        for (const sv of status.servers!) {
            const divSv = document.createElement('div');
            divSv.innerHTML = `<div><span class="gui-sv-item">${sv.name}</span>: <span class="${status2Class(sv.status)}">${sv.status}</span></div>`;
            divSvsB.appendChild(divSv);
        }

        // Resources
        const mapRes: Record<string, HTMLElement[]> = {};
        for (const res of status.resources!) {
            if (!(res.group in mapRes)) mapRes[res.group] = [];
            const r = document.createElement('div');
            r.innerHTML = `<div><span class="gui-grp-sub-item">${res.name}&lt;${res.type}&gt;</span>: <span class="${status2Class(res.status)}">${res.status}</span></div>`;
            r.className = 'gui-sub-body';
            mapRes[res.group].push(r);
        }

        // Groups
        const divGrps = document.createElement('div');
        divCard.appendChild(divGrps);

        const divGrpsH = document.createElement('div');
        divGrpsH.innerText = 'Groups';
        divGrpsH.className = 'gui-header';
        divGrps.appendChild(divGrpsH);

        const divGrpsB = document.createElement('div');
        divGrpsB.className = 'gui-body';
        divGrps.appendChild(divGrpsB);

        for (const grp of status.groups!) {
            const divGrp = document.createElement('div');
            const divGrpItem = document.createElement('span');
            divGrpItem.className = 'gui-grp-item';
            divGrpItem.innerText = grp.name;
            divGrp.appendChild(divGrpItem);
            divGrp.appendChild(document.createTextNode(': '));
            const divGrpStat = document.createElement('span');
            divGrpStat.className = status2Class(grp.status);
            divGrpStat.innerText = grp.status;
            divGrp.appendChild(divGrpStat);
            divGrp.appendChild(document.createTextNode(' '));
            const divGrpOp = document.createElement('span');
            divGrpOp.appendChild(
                createButtonElement(
                    'start',
                    () => {
                        this.execOperation(status.id, {
                            cmd: 'startGroup',
                            name: grp.name,
                            target: status.servers![0].name,
                        });
                    },
                    false,
                    'Start Group',
                ),
            );
            divGrpOp.appendChild(
                createButtonElement(
                    'stop',
                    () => {
                        this.execOperation(status.id, { cmd: 'stopGroup', name: grp.name });
                    },
                    false,
                    'Stop Group',
                ),
            );
            divGrpOp.appendChild(
                createButtonElement(
                    'failover',
                    () => {
                        this.execOperation(status.id, { cmd: 'moveGroup', name: grp.name });
                    },
                    false,
                    'Move Group',
                ),
            );
            divGrp.appendChild(divGrpOp);
            const divCur = document.createElement('div');
            divCur.innerHTML = `<span class="gui-grp-sub-item">current</span>: <span>${grp.current}</span>`;
            divCur.className = 'gui-sub-body';
            divGrp.appendChild(divCur);
            for (const r of mapRes[grp.name]) {
                divGrp.appendChild(r);
            }
            divGrpsB.appendChild(divGrp);
        }

        // Monitors
        const divMons = document.createElement('div');
        divCard.appendChild(divMons);

        const divMonsH = document.createElement('div');
        divMonsH.innerText = 'Monitors';
        divMonsH.className = 'gui-header';
        divMons.appendChild(divMonsH);

        const divMonsB = document.createElement('div');
        divMonsB.className = 'gui-body';
        divMons.appendChild(divMonsB);

        for (const mon of status.monitors!) {
            const divMon = document.createElement('div');
            divMon.innerHTML = `<div><span class="gui-mon-item">${mon.name}&lt;${mon.type}&gt;</span>: <span class="${status2Class(mon.status)}">${mon.status}</span></div>`;
            divMonsB.appendChild(divMon);
        }

        // Card
        divCard.className = 'gui-card';
        element.appendChild(divCard);
    }
}
