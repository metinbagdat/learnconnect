import { neonConfig } from '@neondatabase/serverless';

neonConfig.useSecureWebSocket = false;
neonConfig.wsProxy = () => 'localhost:5488/v1';
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;
