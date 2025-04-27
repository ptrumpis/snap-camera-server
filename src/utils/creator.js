import { CameraKitClient } from "@ptrumpis/snap-camerakit-bridge/client";
import { SnapCameraFormatter } from "@ptrumpis/snap-camerakit-bridge/format";
import * as Util from './helper.js';
import * as Web from './web.js';

const bridgeAddr = process.env.BRIDGE_ADDR;
const apiToken = process.env.BRIDGE_API_TOKEN;
let isInitialized = false;

const client = (bridgeAddr) ? new CameraKitClient(bridgeAddr, { formatter: SnapCameraFormatter }) : null;

async function getLensGroup(groupId) {
    try {
        if (!client) {
            throw new Error('You need to edit your .env file and set BRIDGE_ADDR');
        }

        if (!apiToken) {
            throw new Error('You need to edit your .env file and set BRIDGE_API_TOKEN');
        }

        if (!isInitialized) {
            isInitialized = await client.init(apiToken) || false;
        }

        const lenses = await client.loadLensGroup(groupId);
        return await fixLensesForActivation(lenses);
    } catch (e) {
        console.error(`[Error] Failed to get lens group: ${e.message}`);
    }

    return [];
}

async function fixLensesForActivation(lenses) {
    if (!Array.isArray(lenses)) {
        return lenses;
    }

    return Promise.all(lenses.map(async lens => {
        if (!Util.isLensId(lens.unlockable_id) && lens.uuid) {
            const webLens = await Web.getLensByHash(lens.uuid);
            if (webLens?.unlockable_id) {
                lens = Util.mergeLens(lens, webLens);
                lens.unlockable_id = webLens.unlockable_id;
                lens.lens_id = webLens.unlockable_id;
                lens.web_import = 1;
            }
        }

        return lens;
    }));
}

export { getLensGroup };