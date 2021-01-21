// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/kdbxweb
// Type definitions for kdbxweb 1.2
// Project: https://github.com/keeweb/kdbxweb#readme
// Definitions by: Roang-zero1 <https://github.com/Roang-zero1>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2
// 单独转换为类也非常麻烦

export type KdbxObject = Entry | Group;
export type StringProtected = ProtectedValue | string;

export interface Settings {
    binaries?: boolean;
    customIcons?: boolean;
    historyRules?: boolean;
}

export interface ObjectMap {
    objects: KdbxObject[];
    remote: KdbxObject[];
    deleted: KdbxObject[];
}

export interface BinaryInforamtion {
    ref: string;
    value: ProtectedValue | ArrayBuffer;
}

export interface editingState {
    added: [Date];
    deleted: [Date];
}

export interface editingStateDict {
    meta: editingState;
    [uuid: string]: editingState;
}

export class Credentials {
    //(password: ProtectedValue | null,keyFile: string | ArrayBuffer | Uint8Array | null,challengeResponse: any):Credentials;
    constructor(
        password: ProtectedValue | null,
        keyFile: string | ArrayBuffer | Uint8Array | null,
        challengeResponse: any
    );
    getHash(): Promise<ArrayBuffer>;
    setKeyFile(keyFile: ArrayBuffer | Uint8Array | null): Promise<void>;
    setPassword(password: ProtectedValue | null): Promise<void>;
    static createKeyFileWithHash(hash: string): Uint8Array;
    static createRandomKeyFile(): Uint8Array;
}

export class Int64 {
    constructor(lo: number, hi: number);
    lo: number;
    hi: number;
    valueOf(): number;
    static from(value: number): Int64;
}

export declare class Kdbx {
    constructor();
    header: Header;
    /** 证书 */
    credentials: Credentials;
    meta: Meta;
    /** Document → any */
    xml: any;
    binaries: Binaries;
    /** 组对象 */
    groups: Group[];
    deletedObjects: KdbxObject[];

    /** 将Kdbx数据库保存为ArrayBuffer对象 */
    save(): Promise<ArrayBuffer>;
    /** 将kdbx数据库保存为XML */
    saveXml(): Promise<string>;
    /** 将文件升级到最新版本 */
    upgrade(): void;

    addDeletedObject(uuid: KdbxUuid, dt: Date): void;
    cleanup(settings: Settings): void;
    createBinary(
        value: ProtectedValue | ArrayBuffer
    ): Promise<ProtectedValue | ArrayBuffer>;

    createEntry(group: Group): Entry;

    /** 如果没有默认组, 就创建一个, 第0个序号 */
    createDefaultGroup(): void;
    /** 获取默认的组, 也就是第一个组 */
    getDefaultGroup(): Group;
    /**
     * 创建一个新的组
     * @param group 
     * @param name 组名称
     */
    createGroup(group: Group, name: StringProtected): Group;
    /**
     * 通过组的uuid获取组
     * @param uuid 
     * @param parentGroup 
     */
    getGroup(uuid: KdbxUuid | string, parentGroup?: Group): Group | undefined;
    /** 如果未创建回收站就创建一个 */
    createRecycleBin(): void;


    merge(remote: Kdbx): void;
    /**
     * 将组或元素对象从现在组移动到其他组
     * @param object 将要移动的组或元素
     * @param toGroup 移动到的新组
     * @param atIndex 目标组中的索引（默认情况下，插入到组的末尾）
     */
    move(object: KdbxObject, toGroup: Group, atIndex?: number): void;
    /**
     * 删除组或元素
     * @param object 将要删除的组或元素
     */
    remove(object: KdbxObject): void;

    getLocalEditState(): editingStateDict;
    removeLocalEditState(): void;
    setLocalEditState(editingState: editingStateDict): void;

    static create(credentials: Credentials, name: string): Kdbx;
    static load(data: ArrayBuffer, credentials: Credentials): Promise<Kdbx>;
    static loadXml(data: string, credentials: Credentials): Promise<Kdbx>;
}

export type KdbxErrorCode = typeof Consts.ErrorCodes[keyof typeof Consts.ErrorCodes];

export class KdbxError {
    constructor(code: KdbxErrorCode, message: string);

    name: "KdbxError";
    code: KdbxErrorCode;
    message: string;

    // Native method; no parameter or return type inference available
    toString(): string;
}

export class KdbxUuid {
    constructor(ab: string | ArrayBuffer);
    id: string | undefined;
    empty: boolean;
    equals(other: KdbxUuid): boolean;
    toBytes(): Uint8Array | undefined;
    toString(): string;
    valueOf(): string | undefined;
    static random(): KdbxUuid;
}

export class ProtectedValue {
    constructor(value: ArrayBuffer, salt: ArrayBuffer);
    clone(): ProtectedValue;
    getBinary(): Uint8Array;
    getHash(): Promise<ArrayBuffer>;
    getText(): string;
    includes(str: string): boolean;
    setSalt(newSalt: ArrayBuffer): void;
    toString(): string;
    static fromBinary(binary: ArrayBuffer): ProtectedValue;
    static fromString(str: string): ProtectedValue;
}

export class VarDictionary {
    constructor();
    get(key: string): object;
    keys(): string[];
    remove(key: string): void;
    set(key: string, type: number, value: object): void;
    write(stm: BinaryStream): void;

    static ValueType: {
        Bool: number;
        Bytes: number;
        Int32: number;
        Int64: number;
        String: number;
        UInt32: number;
        UInt64: number;
    };

    static read(stm: BinaryStream): VarDictionary;
}

export const Consts: {
    AutoTypeObfuscationOptions: {
        None: number;
        UseClipboard: number;
    };
    CipherId: {
        Aes: string;
        ChaCha20: string;
    };
    CompressionAlgorithm: {
        GZip: number;
        None: number;
    };
    CrsAlgorithm: {
        ArcFourVariant: number;
        ChaCha20: number;
        Null: number;
        Salsa20: number;
    };
    Defaults: {
        HistoryMaxItems: number;
        HistoryMaxSize: number;
        KeyEncryptionRounds: number;
        MntncHistoryDays: number;
        RecycleBinName: string;
    };
    ErrorCodes: {
        NotImplemented: 'NotImplemented';
        InvalidArg: 'InvalidArg';
        BadSignature: 'BadSignature';
        InvalidVersion: 'InvalidVersion';
        Unsupported: 'Unsupported';
        FileCorrupt: 'FileCorrupt';
        InvalidKey: 'InvalidKey';
        MergeError: 'MergeError';
    };
    Icons: {
        Apple: number;
        Archive: number;
        BlackBerry: number;
        Book: number;
        CDRom: number;
        Certificate: number;
        Checked: number;
        ClipboardReady: number;
        Clock: number;
        Configuration: number;
        Console: number;
        Digicam: number;
        Disk: number;
        Drive: number;
        DriveWindows: number;
        EMail: number;
        EMailBox: number;
        EMailSearch: number;
        Energy: number;
        EnergyCareful: number;
        Expired: number;
        Feather: number;
        Folder: number;
        FolderOpen: number;
        FolderPackage: number;
        Home: number;
        Homebanking: number;
        IRCommunication: number;
        Identity: number;
        Info: number;
        Key: number;
        List: number;
        LockOpen: number;
        MarkedDirectory: number;
        Memory: number;
        Money: number;
        Monitor: number;
        MultiKeys: number;
        NetworkServer: number;
        Note: number;
        Notepad: number;
        Package: number;
        PaperFlag: number;
        PaperLocked: number;
        PaperNew: number;
        PaperQ: number;
        PaperReady: number;
        Parts: number;
        Pen: number;
        Printer: number;
        ProgramIcons: number;
        Run: number;
        Scanner: number;
        Screen: number;
        Settings: number;
        Star: number;
        TerminalEncrypted: number;
        Thumbnail: number;
        Tool: number;
        TrashBin: number;
        Tux: number;
        UserCommunication: number;
        UserKey: number;
        Warning: number;
        Wiki: number;
        World: number;
        WorldComputer: number;
        WorldSocket: number;
        WorldStar: number;
    };
    KdfId: {
        Aes: string;
        Argon2: string;
    };
    Signatures: {
        FileMagic: number;
        Sig2Kdb: number;
        Sig2Kdbx: number;
    };
};

export namespace ByteUtils {
    function arrayBufferEquals(ab1: ArrayBuffer, ab2: ArrayBuffer): boolean;
    function arrayToBuffer(arr: Uint8Array | ArrayBuffer): ArrayBuffer;
    function base64ToBytes(str: string): Uint8Array;
    function bytesToBase64(arr: Uint8Array | ArrayBuffer): string;
    function bytesToHex(arr: Uint8Array | ArrayBuffer): string;
    function bytesToString(arr: Uint8Array | ArrayBuffer): string;
    function hexToBytes(hex: string): Uint8Array;
    function stringToBytes(str: string): Uint8Array;
    function zeroBuffer(buffer: Uint8Array | ArrayBuffer): void;
}

export namespace CryptoEngine {
    const subtle: any | null;// SubtleCrypto → any
    const webCrypto: any | null;// Crypto → any
    const NodeCrypto: any | null;// NodeCrypto → any

    function argon2(
        password: ArrayBuffer,
        salt: ArrayBuffer,
        memory: number,
        iterations: number,
        length: number,
        parallelism: number,
        type: number,
        version: number
    ): Promise<ArrayBuffer>;

    function chacha20(
        data: ArrayBuffer,
        key: ArrayBuffer,
        iv: ArrayBuffer
    ): Promise<ArrayBuffer>;

    function configure(
        newSubtle: any | null,// SubtleCrypto → any
        newWebCrypto: any | null,// Crypto → any
        newNodeCrypto: any | null// Crypto → any
    ): void;
    function createAesCbc(): any;
    function hmacSha256(
        key: ArrayBuffer,
        data: ArrayBuffer
    ): Promise<ArrayBuffer>;

    function random(len: number): Uint8Array;
    function sha256(data: ArrayBuffer): Promise<ArrayBuffer>;
    function sha512(data: ArrayBuffer): Promise<ArrayBuffer>;
}

export namespace Random {
    function getBytes(len: number): Uint8Array;
}

export class BinaryStream {
    constructor(arrayBuffer?: ArrayBuffer | null | undefined);
    getBuffer(): ArrayBuffer | null | undefined;
    getByteLength(): number;
    getFloat32(littleEdian?: boolean): number;
    getFloat64(littleEdian?: boolean): number;
    getInt16(littleEdian?: boolean): number;
    getInt32(littleEdian?: boolean): number;
    getInt8(littleEdian?: boolean): number;
    getPos(): number;
    getUint16(littleEdian?: boolean): number;
    getUint32(littleEdian?: boolean): number;
    getUint64(littleEdian?: boolean): number;
    getUint8(littleEdian?: boolean): number;
    getWrittenBytes(): ArrayBuffer;
    readBytes(size: number): ArrayBuffer;
    readBytesNoAdvance(startPos: number, endPos: number): ArrayBuffer;
    readBytesToEnd(): ArrayBuffer;
    setFloat32(value: number, littleEdian?: boolean): void;
    setFloat64(value: number, littleEdian?: boolean): void;
    setInt16(value: number, littleEdian?: boolean): void;
    setInt32(value: number, littleEdian?: boolean): void;
    setInt8(value: number, littleEdian?: boolean): void;
    setUint16(value: number, littleEdian?: boolean): void;
    setUint32(value: number, littleEdian?: boolean): void;
    setUint64(value: number, littleEdian?: boolean): void;
    setUint8(value: number, littleEdian?: boolean): void;
    writeBytes(bytes: ArrayBuffer | Uint8Array): void;
}

export class Binaries {
    constructor();

    hash(): Promise<any[]>;
    getBinaryHash(
        binary: ProtectedValue | ArrayBuffer | Uint8Array
    ): Promise<string>;
    assignIds(): void;
    add(value: ProtectedValue | ArrayBuffer): Promise<BinaryInforamtion>;
}

export class Context {
    constructor(opts: Kdbx);

    setXmlDate(node: any, dt: Date): void;// Node → any
}

export class Group {
    constructor();

    uuid: KdbxUuid;
    name: StringProtected;
    notes: StringProtected;
    icon: number;
    customIcon: KdbxUuid;
    times: Times;
    expanded: boolean;
    defaultAutoTypeSeq: StringProtected;
    enableAutoType: boolean;
    enableSearching: boolean;
    lastTopVisibleEntry: KdbxUuid;
    groups: Group[];
    entries: Entry[];
    parentGroup: Group;
    customData: {};

    static create(name: StringProtected, parentGroup: Group): Group;
    static read(xmlNode: any, ctx: Context, parentGroup: Group): Group;// Node → any

    write(parentNode: any, ctx: Context): void;// Node → any
    forEach(
        callback: (
            thisArg: (value: any) => void,
            entry: Entry | undefined
        ) => void,
        thisArg: (value: any) => void
    ): void;
    merge(objectMap: ObjectMap): void;
    copyFrom(group: Group): void;
}

/**
 * 单个元素
 */
export class Entry {
    constructor();

    uuid: KdbxUuid;
    icon: number;
    customIcon: KdbxUuid;
    /** 前景色 */
    fgColor: StringProtected;
    /** 背景色 */
    bgColor: StringProtected;
    overrideUrl: StringProtected;
    tags: string[];
    times: Times;
    /** 字段列表 */
    fields: { [key: string]: StringProtected };
    /** 二进制内容 */
    binaries: {};
    autoType: {
        enabled: boolean;
        obfuscation: number;
        defaultSequence: string;
        items: {
            windows: string;
            keystrokeSequence: string;
        };
    };
    /** 历史版本 */
    history: Entry[];
    /** 父级组 */
    parentGroup: Group;
    customData: {};

    /**
     * 创建一个元素
     * @param meta 
     * @param parentGroup 
     */
    static create(meta: Meta, parentGroup: Group): Entry;
    /**
     * 读取 xml 里的元素
     * @param xmlNode Node → any
     * @param ctx 
     * @param parentGroup 
     */
    static read(xmlNode: any, ctx: Context, parentGroup: Group): Entry;

    /**
     * 写入流
     * @param parentNode Node → any
     * @param ctx 
     */
    write(parentNode: any, ctx: Context): void;
    /** 将当前的元素状态推送到历史顶端 */
    pushHistory(): void;
    /**
     * 删除索引开始的一些历史记录
     * @param index 历史开始索引
     * @param count 删除条目数量, 不设置默认为1
     */
    removeHistory(index: number, count: number): void;
    /**
     * 将参数条目内容复制到本条目, 参数也可以是历史条目
     * @param entry 复制的条目
     */
    copyFrom(entry: Entry): void;
    merge(objectMap: ObjectMap): void;
}

export class Meta {
    constructor();

    static create(): Meta;
    static read(xmlNode: any, ctx: Context): Meta;// Node → any

    write(parentNode: any, ctx: Context): void;// Node → any
    merge(remote: Meta, objectMap: ObjectMap): void;
}

export class Header {
    constructor();
    /** 压缩 */
    compression: number;
    /** CRS算法 */
    crsAlgorithm: number;
    /** 数字密码UUID */
    dataCipherUuid: KdbxUuid;
    /** 加密IV */
    encryptionIV: any;
    /** 结束位置 */
    endPos: number;
    /** kdf参数 */
    kdfParameters: VarDictionary;
    /** 密钥加密回合 */
    keyEncryptionRounds: number;
    /** 主种子 */
    masterSeed: Uint8Array;
    /** 受保护的流密钥 */
    protectedStreamKey: any;
    /** 公共自定义数据 */
    publicCustomData: any;
    /** 流起始字节 */
    streamStartBytes: any;
    /** 转换种子 */
    transformSeed: any;
    /** 主要版本 */
    versionMajor: number;
    /** 次要版本 */
    versionMinor: number;

    static read(stm: BinaryStream, ctx: Context): Header;
    static create(): Header;

    generateSalts(): void;
    readInnerHeader(stm: BinaryStream, ctx: Context): void;
    upgrade(): void;
    /**
     * 保存头部到流
     * @param stm 
     */
    write(stm: BinaryStream): void;
    writeInnerHeader(stm: BinaryStream, ctx: Context): void;
}

export class Times {
    constructor();
    /** 创建时间 */
    creationTime: Date;
    /** 最后修改时间 */
    lastModTime: Date;
    /** 最后访问时间 */
    lastAccessTime: Date;
    /** 过期时间 */
    expiryTime: Date;
    /** 是否到期 */
    expires: boolean;
    /** 使用次数 */
    usageCount: number;
    /** 位置变更, 这个是什么意思 */
    locationChanged: Date;

    static create(): Times;
    static read(xmlNode: any): Times;// Node → any

    clone(): Times;
    update(): void;
    write(parentNode: any, ctx: Context): void;// Node → any
}

interface KdbxWeb {
    Kdbx: Kdbx,
    KdbxUuid: KdbxUuid,
    KdbxError: KdbxError,
    Credentials: Credentials,
    Consts: any,//Consts
    ProtectedValue: ProtectedValue,
    ByteUtils: any,
    VarDictionary: VarDictionary,
    Int64: Int64,
    Random: any,// Random.getBytes
    CryptoEngine: any,
}

