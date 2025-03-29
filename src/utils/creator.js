import { BridgeError, CameraKitClient, DataMessage, ErrorMessage } from "@ptrumpis/snap-camerakit-bridge";
import * as dotenv from 'dotenv';
import * as Util from './helper.js';
import * as Web from './web.js';

dotenv.config();

const bridgeAddr = process.env.BRIDGE_ADDR;
const apiToken = process.env.BRIDGE_API_TOKEN;
let isInitialized = false;

const client = (bridgeAddr) ? new CameraKitClient(bridgeAddr) : null;

async function getLensGroup(groupId) {
    try {
        if (!client) {
            throw new Error('You need to edit your .env file and set BRIDGE_ADDR');
        }

        if (!apiToken) {
            throw new Error('You need to edit your .env file and set BRIDGE_API_TOKEN');
        }

        let message = null;
        if (!isInitialized) {
            message = await client.init(apiToken);
            if (message instanceof ErrorMessage) {
                throw BridgeError.fromJSON(message.error);
            } else if (message instanceof DataMessage) {
                isInitialized = (message.data) ? true : false;
            }
        }

        message = await client.getLensGroup(groupId);
        if (message instanceof ErrorMessage) {
            throw BridgeError.fromJSON(message.error);
        } else if (message instanceof DataMessage) {
            return await fixLensesForActivation(message.data);
        }
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