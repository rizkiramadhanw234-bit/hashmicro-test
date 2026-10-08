import { BaseEntity } from "../../entities/base.entity.js";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity.js";
import { RefreshToken } from "./token.entity.js";

@Entity("session")
export class Session extends BaseEntity {
  @Column({ name: "user_id", type: "varchar", length: 255, nullable: true })
  userId: string;

  @Column({
    name: "refresh_token_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  refreshTokenId: string;

  @Column({ name: "ip_address", type: "varchar", length: 255, nullable: true })
  ipAddress: string;

  @Column({ name: "user-agent", type: "varchar", length: 255, nullable: true })
  userAgent: string;

  //   relations
  @ManyToOne(() => RefreshToken, (token) => token.session, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "refresh_token_id" })
  refreshToken: RefreshToken;

  @ManyToOne(() => User, (user) => user.session, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;
}
