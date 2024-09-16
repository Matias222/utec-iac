import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TsRepoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2, 
    });

    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      description: 'Allow all traffic from anywhere',
      allowAllOutbound: true 
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic(), 'Allow all traffic from anywhere');

    const role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore') 
      ]
    });

    const ubuntuAmi = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*',
      owners: ['099720109477'] 
    });


    const userData = ec2.UserData.forLinux();

    userData.addCommands(
      'cd home/ubuntu',
      'sudo snap install docker',
      'git clone https://github.com/Matias222/utec-cloud-semana4.git',
      'cd utec-cloud-semana4/compose',
      'sleep 60',
      'sudo docker compose up -d'
    )

    const ec2Instance = new ec2.Instance(this, 'utecc_cloud_proyecto_1_ts', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO), 
      machineImage: ubuntuAmi, 
      vpc,
      role,
      securityGroup,
      keyName: 'utec_ec2', 
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC  
      },
      userData: userData, 
    });

    new cdk.CfnOutput(this, 'InstancePublicIp', {
      value: ec2Instance.instancePublicIp,
    });
  }
}
