import { Module } from '@nestjs/common';
import { NluPort } from '../../application/ports/nlu.port';
import { OpenAiNluAdapter } from './openai-nlu.adapter';

@Module({
  providers: [{ provide: NluPort, useClass: OpenAiNluAdapter }],
  exports: [NluPort],
})
export class NluModule {}
