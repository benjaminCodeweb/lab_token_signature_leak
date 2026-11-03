import crypto from 'crypto';

// La flag es la "clave maestra de la organización" que solo ve un admin.
// Se deriva en runtime; el preimagen no viaja al bundle cliente.
const PREIMAGE = 'kanbia::org-master-key::jwt-secret-disclosure::2026';

export const FLAG = `FLAG{${crypto.createHash('md5').update(PREIMAGE).digest('hex')}}`;
