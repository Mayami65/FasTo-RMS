import * as os from 'os';
import * as crypto from 'crypto';

export function getMachineFingerprint(): string {
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const cpuModel = os.cpus()[0]?.model || 'unknown-cpu';

    // Create a stable string based on hardware/environment properties
    const rawString = `${platform}-${arch}-${hostname}-${cpuModel}`;

    // Hash it for a cleaner ID
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');

    // Return a professional-looking shorter ID
    return `RMS-${hash.slice(0, 12).toUpperCase()}`;
}
